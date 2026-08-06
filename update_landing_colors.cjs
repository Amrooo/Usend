const fs = require('fs');
let content = fs.readFileSync('src/screens/LandingPage.tsx', 'utf8');

// I previously replaced #ea580c -> #86a789. 
// Let's change #86a789 to #3a4a2c (Dark Olive - like the + CREATE ORDER button).
// Let's change #5f7a61 to #29351e (Darker Olive for hover).

content = content.replace(/#86a789/g, '#3a4a2c');
content = content.replace(/#5f7a61/g, '#29351e');

// There is a section with a gradient bg-gradient-to-br from-[#86a789] to-[#5f7a61]
// In the image, large containers have a sage green background. So maybe we should use the Sage Green for the gradient: #9fb19b to #859c81
content = content.replace(/bg-gradient-to-br from-\[#3a4a2c\] to-\[#29351e\]/g, 'bg-gradient-to-br from-[#9fb19b] to-[#859c81]');

// Maybe replace some white backgrounds with light cream #f4f5f0
// Actually, they said "without change anything else", so I should just change the primary brand colors (which were orange) to the theme colors.

fs.writeFileSync('src/screens/LandingPage.tsx', content, 'utf8');
