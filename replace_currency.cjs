const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if(!dirPath.includes('node_modules') && !dirPath.includes('.git') && !dirPath.includes('dist')) {
         walk(dirPath, callback);
      }
    } else if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
      callback(path.join(dirPath));
    }
  });
}

const usdRegex = /\$(\d+(\.\d{2})?)/g;
const genericDollarSign = /\$/g;

walk(path.join(__dirname, 'src'), function(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  // Replace places where we hardcoded $150.00 -> AED 150.00
  newContent = newContent.replace(/\$(\d+(\.\d+)?)/g, 'AED $1');
  
  // Replace instances of 'Price ($)' -> 'Price (AED)'
  newContent = newContent.replace(/Price \(\$\)/g, 'Price (AED)');
  newContent = newContent.replace(/Cost \(\$\)/g, 'Cost (AED)');
  
  // Replace instances of '+$$amt' -> '+AED$amt' wait, +${amt} -> +AED ${amt}
  newContent = newContent.replace(/\+\$\{(\w+)\}/g, '+AED ${$1}');
  
  // +$100 -> +AED 100
  newContent = newContent.replace(/\+\$(\d+)/g, '+AED $1');
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
  }
});
console.log('Done');
