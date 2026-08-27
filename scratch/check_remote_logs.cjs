const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.shell((err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));

    stream.write('cd /home/1150801.cloudwaysapps.com/mksqztfeks/public_html\n');
    stream.write('pkill -9 -f node || true\n');
    stream.write('sleep 1\n');
    stream.write('(nohup node functions/server.cjs > server.log 2>&1 < /dev/null &)\n');
    stream.write('sleep 3\n');
    stream.write('echo "=== DIRECT HTTP PORT 3005 ==="\n');
    stream.write('curl -s http://127.0.0.1:3005/api/payments/config\n');
    stream.write('echo ""\n');
    stream.write('echo "=== GATEWAY PHP HTTPS ==="\n');
    stream.write('curl -s "https://www.trsh.ae/api.php?path=/api/payments/config"\n');
    stream.write('echo ""\n');
    stream.write('exit\n');
  });
}).connect({
  host: '134.209.28.27',
  port: 22,
  username: 'master_awqbxuyqcq',
  password: 'rW9MJAfvXn4n'
});
