const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Connection Established with Cloudways Server...');

  const apiKey = "gxgyh5bcTvarO0iX9N7vMsRv4NZpoMWlu1Wm2Cg3eZW1oR4u5a7Cn24RwpZK3LOZUgMGIOPLv2crIVARo1VppbUPzlELLSA0qk9O2gcVtgRkG6Sk8Ag9OZubOvkMwNWh";

  // Location 1: Dubai Marina branch
  const loc1 = JSON.stringify({
    name: "TRSH Dubai Marina Branch",
    contact_phone_number: "+971522715506",
    address_line: "Dubai Marina Walk, Tower B",
    city: "Dubai",
    country_code: "AE",
    latitude: 250785000,
    longitude: 551390000,
    external_code: "TRSH_MARINA_01"
  });

  // Location 2: Abu Dhabi branch
  const loc2 = JSON.stringify({
    name: "TRSH Abu Dhabi Hub",
    contact_phone_number: "+971522715506",
    address_line: "Al Reem Island, Sky Tower",
    city: "Abu Dhabi",
    country_code: "AE",
    latitude: 244950000,
    longitude: 543950000,
    external_code: "TRSH_AUH_01"
  });

  const cmd = `
    echo "=========================================================================="
    echo ">>> TEST 1: Creating Pickup Point for Location 1 (Dubai Marina)"
    curl -s --compressed -w "\nHTTP_STATUS:%{http_code}\n" -X POST "https://food-api-team.noon.team/public/v1/pickup-points/create" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -H "X-API-KEY: ${apiKey}" \
      -d '${loc1}'

    echo ""
    echo "=========================================================================="
    echo ">>> TEST 2: Creating Pickup Point for Location 2 (Abu Dhabi)"
    curl -s --compressed -w "\nHTTP_STATUS:%{http_code}\n" -X POST "https://food-api-team.noon.team/public/v1/pickup-points/create" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -H "X-API-KEY: ${apiKey}" \
      -d '${loc2}'

    echo ""
    echo "=========================================================================="
    echo ">>> TEST 3: Listing all Pickup Points on Production"
    curl -s --compressed -w "\nHTTP_STATUS:%{http_code}\n" -X GET "https://food-api-team.noon.team/public/v1/pickup-points/list" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -H "X-API-KEY: ${apiKey}"
    echo "=========================================================================="
  `;

  conn.exec(cmd, (err, stream) => {
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
