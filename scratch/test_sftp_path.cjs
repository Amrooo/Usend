const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    sftp.readdir('.', (rErr, list) => {
      if (rErr) throw rErr;
      console.log('SFTP Current Directory Files:');
      list.forEach(item => console.log(' -', item.filename));
      conn.end();
    });
  });
}).connect({
  host: '134.209.28.27',
  port: 22,
  username: 'master_awqbxuyqcq',
  password: 'rW9MJAfvXn4n'
});
