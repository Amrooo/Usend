import https from 'https';

function checkUrl(hostname: string) {
  return new Promise((resolve) => {
    const req = https.get(`https://${hostname}`, { timeout: 5000 }, (res) => {
      resolve(`${hostname}: ${res.statusCode}`);
    }).on('error', (e) => {
      resolve(`${hostname}: ERROR ${e.message}`);
    }).on('timeout', () => {
      req.destroy();
      resolve(`${hostname}: ERROR Connection Timeout`);
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
