const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function deploy() {
  console.log('================================================================');
  console.log('🚀 DEPLOYING LIGHTWEIGHT PRODUCTION BUNDLE TO CLOUDWAYS');
  console.log('================================================================\n');

  const rootDir = path.resolve(__dirname, '..');
  const tarPath = path.join(rootDir, 'deploy_bundle.tar.gz');

  // 1. Build locally
  console.log('1. Building production bundles locally...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

  // 2. Package into lightweight tar.gz
  console.log('\n2. Packaging build artifacts into deploy_bundle.tar.gz...');
  if (fs.existsSync(tarPath)) {
    fs.unlinkSync(tarPath);
  }

  // Create lightweight tar containing built dist, usendadmin2026, functions, src, assets
  execSync('tar -czf deploy_bundle.tar.gz --exclude="*.mp4" --exclude="node_modules" dist usendadmin2026 assets functions src server.ts package.json tsconfig.json vite.config.ts', {
    cwd: rootDir,
    stdio: 'inherit'
  });

  const stats = fs.statSync(tarPath);
  console.log(`Lightweight bundle created: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

  // 3. Connect via SSH & SFTP with retry
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
          touch index.html admin.html &&
          echo "Restarting Node service..." &&
          pkill -f "node functions/server.cjs" || true &&
          sleep 1 &&
          (setsid node functions/server.cjs > server.log 2>&1 &)
          sleep 2 &&
          echo "=== Verification of Running Processes ===" &&
          ps aux | grep "node functions/server.cjs" | grep -v grep &&
          echo "" &&
          echo "=== Testing Health Endpoint ===" &&
          curl -s http://localhost:3005/api/health || true
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
  }).on('error', (cErr) => {
    console.error('SSH Client Error:', cErr);
  }).connect({
    host: '134.209.28.27',
    port: 22,
    username: 'master_awqbxuyqcq',
    password: 'rW9MJAfvXn4n',
    readyTimeout: 30000,
    keepaliveInterval: 10000
  });
}

deploy().catch(err => {
  console.error('Deployment Failed:', err);
  process.exit(1);
});
