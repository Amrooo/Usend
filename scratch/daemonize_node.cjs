const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /home/1150801.cloudwaysapps.com/mksqztfeks/public_html
    kill $(pgrep -f "node functions/server.cjs") 2>/dev/null || true
    sleep 1
    nohup node functions/server.cjs </dev/null >/home/1150801.cloudwaysapps.com/mksqztfeks/public_html/server.log 2>&1 &
    sleep 3
    ps aux | grep "node functions/server.cjs" | grep -v grep
    echo "Testing local port 3005:"
    curl -s -I http://127.0.0.1:3005/api/health || true
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
