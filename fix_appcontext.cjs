const fs = require('fs');

let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

content = content.replace(/email: u\.email,/g, "email: u.email || 'guest@usend.com',");

fs.writeFileSync('src/context/AppContext.tsx', content, 'utf8');
