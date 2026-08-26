const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Connection Established...');
  
  const key1 = "gxgyh5bcTvarO0iX9N7vMsRv4NZpoMWlu1Wm2Cg3eZW1oR4u5a7Cn24RwpZK3LOZUgMGIOPLv2crIVARo1VppbUPzlELLSA0qk9O2gcVtgRkG6Sk8Ag9OZubOvkMwNWh";
  
  const payload = JSON.stringify({
    name: "TRSH Main Warehouse",
    contact_phone_number: "+971501234567",
    phone_number: "+971501234567",
    address_line: "Al Quoz Industrial Area 3, Warehouse 12",
    address_line_1: "Al Quoz Industrial Area 3",
    address_line_2: "Warehouse 12",
    city: "Dubai",
    country_code: "AE",
    latitude: 251412000,
    longitude: 552345000,
    external_code: "TRSH_WH_01"
  });

  const cmd = `
    echo "=========================================================================="
    echo ">>> Testing POST /public/v1/pickup-points/create on Production"
    curl -s --compressed -w "\nHTTP_STATUS:%{http_code}\n" -X POST "https://food-api-team.noon.team/public/v1/pickup-points/create" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -H "X-API-KEY: ${key1}" \
      -d '${payload}'
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
