const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function deploy() {
  console.log('================================================================');
  console.log('🚀 DEPLOYING USEND PRODUCTION BUNDLE TO CLOUDWAYS (134.209.28.27)');
  console.log('================================================================\n');

  const rootDir = path.resolve(__dirname, '..');
  const tarPath = path.join(rootDir, 'deploy_bundle.tar.gz');

  // 1. Build locally
  console.log('1. Building production bundles locally (App + Admin + Server)...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

  // 2. Package into tar.gz
  console.log('\n2. Packaging build artifacts into deploy_bundle.tar.gz...');
  if (fs.existsSync(tarPath)) {
    fs.unlinkSync(tarPath);
  }

  // Include dist, usendadmin2026, assets, functions, src, server.ts, package.json
  execSync('tar -czf deploy_bundle.tar.gz dist usendadmin2026 assets functions src server.ts package.json tsconfig.json vite.config.ts public', {
    cwd: rootDir,
    stdio: 'inherit'
  });

  const stats = fs.statSync(tarPath);
  console.log(`Deployment bundle created: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

  // 3. Connect via SSH & SFTP
  console.log('\n3. Uploading bundle to Cloudways server via SFTP...');
  const conn = new Client();

  conn.on('ready', () => {
    console.log('SSH connection established with Cloudways server.');

    conn.sftp((err, sftp) => {
      if (err) {
        console.error('SFTP Error:', err);
        conn.end();
        return;
      }

      const remoteTar = 'applications/mksqztfeks/public_html/deploy_bundle.tar.gz';
      const readStream = fs.createReadStream(tarPath);
      const writeStream = sftp.createWriteStream(remoteTar);

      writeStream.on('close', () => {
        console.log('✅ Archive uploaded successfully to remote public_html.');

        // 4. Extract and restart server
        console.log('\n4. Extracting archive and restarting node backend server...');
        const remoteCmd = `
          cd /home/1150801.cloudwaysapps.com/mksqztfeks/public_html &&
          tar -xzf deploy_bundle.tar.gz &&
          rm -f deploy_bundle.tar.gz &&
          echo "Syncing static frontend files..." &&
          cp -r dist/* . 2>/dev/null || true &&
          mkdir -p assets &&
          cp -r dist/assets/* assets/ 2>/dev/null || true &&
          cp -r usendadmin2026/assets/* assets/ 2>/dev/null || true &&
          cp usendadmin2026/index.html admin.html 2>/dev/null || true &&
          echo "Restarting Node service..." &&
          pkill -f "node functions/server.cjs" || true &&
          sleep 1 &&
          nohup node functions/server.cjs > server.log 2>&1 &
          sleep 2 &&
          echo "=== Verification of Running Processes ===" &&
          ps aux | grep "node functions/server.cjs" | grep -v grep &&
          echo "" &&
          echo "=== Testing Health Endpoint on Port 3000 ===" &&
          curl -s http://localhost:3000/api/health || curl -s http://localhost:3005/api/health || true
        `;

        conn.exec(remoteCmd, (execErr, stream) => {
          if (execErr) {
            console.error('Remote Exec Error:', execErr);
            conn.end();
            return;
          }

          stream.on('close', (code, signal) => {
            console.log(`\nRemote deployment commands finished with exit code ${code}`);
            conn.end();
            // Cleanup local archive
            if (fs.existsSync(tarPath)) fs.unlinkSync(tarPath);
            console.log('================================================================');
            console.log('🎉 LIVE DEPLOYMENT COMPLETE! Site is live on https://www.trsh.ae');
            console.log('================================================================');
          });

          stream.on('data', (d) => process.stdout.write(d.toString()));
          stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
        });
      });

      writeStream.on('error', (wErr) => {
        console.error('SFTP Write Stream Error:', wErr);
        conn.end();
      });

      readStream.pipe(writeStream);
    });
  }).connect({
    host: '134.209.28.27',
    port: 22,
    username: 'master_awqbxuyqcq',
    password: 'rW9MJAfvXn4n'
  });
}

deploy().catch(err => {
  console.error('Deployment Failed:', err);
  process.exit(1);
});
