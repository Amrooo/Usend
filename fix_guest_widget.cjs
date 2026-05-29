const fs = require('fs');
let guest = fs.readFileSync('src/components/GuestOrderWidget.tsx', 'utf8');

const regex = /\{\/\* USend Local \*\/\}[\s\S]*?<label className="group relative">[\s\S]*?USend Local Fleet[\s\S]*?<\/label>/;
guest = guest.replace(regex, '');

// Also let's just make sure "usend" is not the default state:
guest = guest.replace(/courier: 'usend' as const/g, "courier: 'aramex' as const");
guest = guest.replace(/courier: 'usend'/g, "courier: 'aramex'");

fs.writeFileSync('src/components/GuestOrderWidget.tsx', guest);
