const fs = require('fs');
let guest = fs.readFileSync('src/components/GuestOrderWidget.tsx', 'utf8');
const rx = /\{\/\* USend Standard \*\/\}[\s\S]*?<\/label>/;
guest = guest.replace(rx, '');
// Ensure default courier state is Aramex
guest = guest.replace(/courier:\s*'usend'/g, "courier: 'aramex'");
fs.writeFileSync('src/components/GuestOrderWidget.tsx', guest);
