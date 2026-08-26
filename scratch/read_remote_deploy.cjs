const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('cat /home/1150801.cloudwaysapps.com/mksqztfeks/public_html/deploy_live.cjs || cat /home/1150801.cloudwaysapps.com/mksqztfeks/public_html/.env', (err, stream) => {
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
