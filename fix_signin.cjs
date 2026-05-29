const fs = require('fs');
let lp = fs.readFileSync('src/screens/LandingPage.tsx', 'utf8');
lp = lp.replace(/bg-\[#1452D1\] hover:bg-blue-600([\s\S]*?)id="header-signin-btn"/, 'bg-[#22C55E] hover:bg-emerald-600$1id="header-signin-btn"');
fs.writeFileSync('src/screens/LandingPage.tsx', lp);
