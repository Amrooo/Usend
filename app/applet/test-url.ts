import https from 'https';

function checkUrl(hostname: string) {
  return new Promise((resolve) => {
    https.get(`https://${hostname}`, (res) => {
      resolve(`${hostname}: ${res.statusCode}`);
    }).on('error', (e) => {
      resolve(`${hostname}: ERROR ${e.message}`);
    });
  });
}

(async () => {
  const results = await Promise.all([
    checkUrl('ws.sbx.aramex.net'),
    checkUrl('ws.dev.aramex.net'),
    checkUrl('ws.aramex.net')
  ]);
  console.log(results);
})();
