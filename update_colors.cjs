const fs = require('fs');
const path = require('path');

// 1. Process SVG Logo
const svgPath = 'src/assets/usend-logo.svg';
if (fs.existsSync(svgPath)) {
  let svgContent = fs.readFileSync(svgPath, 'utf8');
  // replace the yellow fills with blue
  svgContent = svgContent.replace(/rgb\(247,206,0\)/g, '#1452D1');
  svgContent = svgContent.replace(/rgb\(169,141,3\)/g, '#1e3a8a');
  fs.writeFileSync(svgPath, svgContent);
  console.log('Updated logo colors');
}

// 2. Remove AI Assist Text
const lpPath = 'src/screens/LandingPage.tsx';
if (fs.existsSync(lpPath)) {
  let lp = fs.readFileSync(lpPath, 'utf8');
  // Remove "USend AI Assist" in the button
  lp = lp.replace(/<span>USend AI Assist<\/span>/g, '');
  lp = lp.replace(/Hello! I am USend AI Assistant./g, 'Hello! I am the Support Bot.');
  lp = lp.replace(/USend AI Assistant/g, 'Support Bot');
  
  // Protect Sign In button
  lp = lp.replace(/bg-\[#22C55E\] hover:bg-emerald-600(.*?)>(\s*)\{isRTL \? 'تسجيل الدخول' : 'Sign In'\}/g, 'bg-SIGNIN_COLOR hover:bg-SIGNIN_HOVER$1>$2{isRTL ? \'تسجيل الدخول\' : \'Sign In\'}');

  fs.writeFileSync(lpPath, lp);
}

// 3. Replace all emerald and green with blue
function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const allTsxFiles = walkDir('src');
for (const file of allTsxFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    const before = content;
    // skip sign in color replacements
    content = content.replace(/#22C55E/g, '#1452D1');
    content = content.replace(/bg-emerald-/g, 'bg-blue-');
    content = content.replace(/text-emerald-/g, 'text-blue-');
    content = content.replace(/border-emerald-/g, 'border-blue-');
    content = content.replace(/shadow-emerald-/g, 'shadow-blue-');
    content = content.replace(/bg-green-/g, 'bg-blue-');
    content = content.replace(/text-green-/g, 'text-blue-');
    content = content.replace(/border-green-/g, 'border-blue-');
    
    if (content !== before) {
        fs.writeFileSync(file, content);
        console.log('Updated colors in', file);
    }
}

// Restore Sign In button
if (fs.existsSync(lpPath)) {
  let lp = fs.readFileSync(lpPath, 'utf8');
  lp = lp.replace(/bg-SIGNIN_COLOR hover:bg-SIGNIN_HOVER/g, 'bg-[#22C55E] hover:bg-emerald-600');
  fs.writeFileSync(lpPath, lp);
  console.log('Restored Sign In button in LandingPage.tsx');
}
