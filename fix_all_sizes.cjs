const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const sizeMap = {
  'text-[6px]': 'text-[8px]',
  'text-[7px]': 'text-[9px]',
  'text-[7.5px]': 'text-[9px]',
  'text-[8px]': 'text-[10px]',
  'text-[8.5px]': 'text-[10px]',
  'text-[9px]': 'text-[11px]',
  'text-[9.5px]': 'text-[11px]',
  'text-[10px]': 'text-[12px]',
  'text-[10.5px]': 'text-[12px]',
  'text-[11px]': 'text-[13px]',
  'text-[11.5px]': 'text-[14px]',
  'text-[12px]': 'text-[14px]',
  'text-[12.5px]': 'text-[15px]',
  'text-[13px]': 'text-[15px]'
};

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    for (const [key, value] of Object.entries(sizeMap)) {
      const re = new RegExp(key.replace(/\[/g, '\\[').replace(/\]/g, '\\]').replace(/\./g, '\\.'), 'g');
      if (re.test(content)) {
        content = content.replace(re, value);
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log('Updated', filePath);
    }
  }
});
