const fs = require('fs');

let file = fs.readFileSync('src/screens/LandingPage.tsx', 'utf8');

// The partner logos start around line 39 and end around line 105
let before = file.substring(0, file.indexOf('const MaerskLogo'));
let logos = file.substring(file.indexOf('const MaerskLogo'), file.indexOf('const LandingPage'));
let after = file.substring(file.indexOf('const LandingPage'));

// Replace dark colors with white
logos = logos.replace(/bg-stone-900/g, 'bg-white/10'); // Or bg-white if it's the box, let's just make text white
logos = logos.replace(/bg-stone-900/g, 'bg-white');
logos = logos.replace(/text-stone-900/g, 'text-white');
logos = logos.replace(/text-stone-950/g, 'text-white');
logos = logos.replace(/text-\[\#1c1917\]/g, 'text-white');

fs.writeFileSync('src/screens/LandingPage.tsx', before + logos + after);

// ALSO eliminate the "Ready to Settle" section from lines around 1558 to 1586
let lp = fs.readFileSync('src/screens/LandingPage.tsx', 'utf8');

// The easiest way is to use regex matching the section
const regex = /\{\/\* LET'S MOVE YOUR BUSINESS FORWARD BANNER \*\/\}[\s\S]*?<\/section>/m;
lp = lp.replace(regex, '');

fs.writeFileSync('src/screens/LandingPage.tsx', lp);
console.log('Fixed logos and removed banner');
