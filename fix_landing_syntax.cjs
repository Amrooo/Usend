const fs = require('fs');
const path = 'src/screens/LandingPage.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/\\n/g, '');

fs.writeFileSync(path, content, 'utf8');
