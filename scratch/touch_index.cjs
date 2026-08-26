const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /home/1150801.cloudwaysapps.com/mksqztfeks/public_html
    touch index.html admin.html
    echo "=== Current index.html JS script tag ==="
    grep -o 'src="/assets/[^"]*"' index.html || grep -o 'src="assets/[^"]*"' index.html
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
