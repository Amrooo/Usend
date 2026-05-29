const fs = require('fs');

let file = fs.readFileSync('src/screens/LandingPage.tsx', 'utf8');

// Change gradient greens #DCFCE7 -> #DBEAFE (blue-100) or similar light blue from tailwind
// #F4FBF7 -> #EFF6FF (blue-50)
// #F0FDF4 -> #EFF6FF (also blue-50)
file = file.replace(/from-\[\#DCFCE7\]/g, 'from-[#DBEAFE]');
file = file.replace(/via-\[\#F4FBF7\]/g, 'via-[#EFF6FF]');
file = file.replace(/from-\[\#F0FDF4\]/g, 'from-[#EFF6FF]');

// Change rgba green (34,197,94) or (34, 197, 94) to blue (20,82,209)
file = file.replace(/rgba\(34,197,94,/g, 'rgba(20,82,209,');

// Also update the sign in button that I just noticed
file = file.replace(
  /bg-\[\#22C55E\] hover:bg-emerald-600(.*?)id="header-signin-btn"/s,
  'bg-[#1452D1] hover:bg-blue-600$1id="header-signin-btn"'
);

fs.writeFileSync('src/screens/LandingPage.tsx', file);
