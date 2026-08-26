const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Connection Established...');

  const cmd = `
    echo "=== Current Working Directory & Files in public_html ==="
    ls -la /home/1150801.cloudwaysapps.com/mksqztfeks/public_html
    echo ""
    echo "=== Running Node / PM2 Processes ==="
    pm2 status || ps aux | grep node
    echo ""
    echo "=== Node & NPM Version ==="
    node -v
    npm -v
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', (d) => process.stdout.write(d))
      .stderr.on('data', (d) => process.stderr.write(d));
  });
}).connect({
  host: '134.209.28.27',
  port: 22,
  username: 'master_awqbxuyqcq',
  password: 'rW9MJAfvXn4n'
});
