const fs = require('fs');
const path = 'src/screens/LandingPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacePoint = '{/* TIMELINE SECTION - Full Width */}';
content = content.replace(replacePoint, '      </div>\\n      {/* TIMELINE SECTION - Full Width */}');

fs.writeFileSync(path, content, 'utf8');
console.log("Added back closing div");
