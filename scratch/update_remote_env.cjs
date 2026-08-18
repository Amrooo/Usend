const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const command = `echo '\n# Noon Rider on Demand Configuration\nNOON_API_KEY="noon-partners-key-id-37f0867306304eec8f901eb2a6945f41"' >> /home/1150801.cloudwaysapps.com/mksqztfeks/public_html/.env`;
  
  conn.exec(command, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '134.209.28.27',
  port: 22,
  username: 'master_awqbxuyqcq',
  password: 'rW9MJAfvXn4n'
});
