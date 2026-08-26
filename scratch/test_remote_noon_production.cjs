const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Connection Established with Cloudways Production Server (134.209.28.27)...');
  
  // Test both keys:
  // Key 1: TRSH Production API Key
  // Key 2: noon-partners-key-id-37f0867306304eec8f901eb2a6945f41
  const key1 = "gxgyh5bcTvarO0iX9N7vMsRv4NZpoMWlu1Wm2Cg3eZW1oR4u5a7Cn24RwpZK3LOZUgMGIOPLv2crIVARo1VppbUPzlELLSA0qk9O2gcVtgRkG6Sk8Ag9OZubOvkMwNWh";
  const key2 = "noon-partners-key-id-37f0867306304eec8f901eb2a6945f41";
  
  const cmd = `
    echo "=========================================================================="
    echo ">>> TEST 1: Testing Production API Key 1 (TRSH Key)"
    curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X GET "https://food-api-team.noon.team/public/v1/pickup-points/list" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -H "X-API-KEY: ${key1}"

    echo ""
    echo "=========================================================================="
    echo ">>> TEST 2: Testing Production API Key 2"
    curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X GET "https://food-api-team.noon.team/public/v1/pickup-points/list" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -H "X-API-KEY: ${key2}"
    echo "=========================================================================="
  `;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect({
  host: '134.209.28.27',
  port: 22,
  username: 'master_awqbxuyqcq',
  password: 'rW9MJAfvXn4n'
});
