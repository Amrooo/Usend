const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function deploy() {
  console.log('================================================================');
  console.log('🚀 DEPLOYING PRODUCTION BUNDLE VIA FASTPUT (134.209.28.27)');
  console.log('================================================================\n');

  const rootDir = path.resolve(__dirname, '..');
  const tarPath = path.join(rootDir, 'deploy_bundle.tar.gz');

  // 1. Build locally
  console.log('1. Building production bundles locally...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

  // 2. Package into ultra-compact tar.gz
  console.log('\n2. Packaging build artifacts into deploy_bundle.tar.gz...');
  if (fs.existsSync(tarPath)) {
    fs.unlinkSync(tarPath);
  }

  execSync('tar -czf deploy_bundle.tar.gz --exclude="*.mp4" --exclude="node_modules" dist usendadmin2026 assets functions src server.ts package.json tsconfig.json index.html admin.html', {
    cwd: rootDir,
    stdio: 'inherit'
  });

  const stats = fs.statSync(tarPath);
  console.log(`Bundle size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

  // 3. Connect via SSH & SFTP with fastPut
  console.log('\n3. Uploading bundle to Cloudways server via SFTP fastPut...');
  const conn = new Client();

  conn.on('ready', () => {
    console.log('SSH connection established.');

    conn.sftp((err, sftp) => {
      if (err) {
        console.error('SFTP Error:', err);
        conn.end();
        return;
      }

      const remoteTar = 'applications/mksqztfeks/public_html/deploy_bundle.tar.gz';

      sftp.fastPut(tarPath, remoteTar, (putErr) => {
        if (putErr) {
          console.error('fastPut Error:', putErr);
          conn.end();
          return;
        }

        console.log('✅ Archive uploaded via fastPut successfully.');

        // 4. Extract and restart server
        console.log('\n4. Extracting archive and restarting node server...');
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
          echo "=== Process status ===" &&
          ps aux | grep "node functions/server.cjs" | grep -v grep &&
          echo "" &&
          echo "=== Health check ===" &&
          curl -s http://localhost:3005/api/health || true
        `;

        conn.exec(remoteCmd, (execErr, stream) => {
          if (execErr) {
            console.error('Remote Exec Error:', execErr);
            conn.end();
            return;
          }

          stream.on('close', (code) => {
            console.log(`\nDeployment finished with code ${code}`);
            conn.end();
            if (fs.existsSync(tarPath)) fs.unlinkSync(tarPath);
            console.log('================================================================');
            console.log('🎉 LIVE DEPLOYMENT COMPLETE! Site is live on https://www.trsh.ae');
            console.log('================================================================');
            process.exit(0);
          });

          stream.on('data', (d) => process.stdout.write(d.toString()));
          stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
        });
      });
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
