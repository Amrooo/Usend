const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /home/1150801.cloudwaysapps.com/mksqztfeks/public_html
    # Check if process is running
    PID=$(pgrep -f "node functions/server.cjs" || true)
    if [ -z "$PID" ]; then
      echo "Starting node server..."
      nohup node functions/server.cjs > server.log 2>&1 &
      sleep 2
    else
      echo "Node server running with PID: $PID"
    fi
    curl -s http://localhost:3005/api/health || true
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
