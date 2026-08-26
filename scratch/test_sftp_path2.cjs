const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    sftp.readdir('applications/mksqztfeks/public_html', (rErr, list) => {
      if (rErr) throw rErr;
      console.log('Successfully reached public_html! Found', list.length, 'files.');
      conn.end();
    });
  });
}).connect({
  host: '134.209.28.27',
  port: 22,
  username: 'master_awqbxuyqcq',
  password: 'rW9MJAfvXn4n'
});
