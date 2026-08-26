const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Connection Established...');

  const cmd = `
    echo "=== 1. Checking Active Node Process ==="
    ps aux | grep "node functions/server.cjs" | grep -v grep
    echo ""
    echo "=== 2. Checking Local Backend Health on Server ==="
    curl -s -i http://localhost:3000/api/health || curl -s -i http://localhost:3005/api/health
    echo ""
    echo "=== 3. Checking Server Log (Last 20 lines) ==="
    tail -n 20 /home/1150801.cloudwaysapps.com/mksqztfeks/public_html/server.log
    echo ""
    echo "=== 4. Checking Public URL Response ==="
    curl -s -I https://www.trsh.ae/
    echo ""
    echo "=== 5. Checking Admin Portal URL Response ==="
    curl -s -I https://www.trsh.ae/admin.html
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', (d) => process.stdout.write(d.toString()))
      .stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
}).connect({
  host: '134.209.28.27',
  port: 22,
  username: 'master_awqbxuyqcq',
  password: 'rW9MJAfvXn4n'
});
