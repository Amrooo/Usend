const fs = require('fs');

const filePaths = ['src/screens/LandingPage.tsx', 'src/components/GuestOrderWidget.tsx', 'src/screens/PortalRegister.tsx', 'src/components/CustomDatePicker.tsx'];

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
  'text-[11.5px]': 'text-[13px]',
  'text-[12px]': 'text-[14px]',
  'text-[12.5px]': 'text-[14px]',
  'text-[13px]': 'text-[15px]'
};

for (const p of filePaths) {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    for (const [key, value] of Object.entries(sizeMap)) {
      content = content.replace(new RegExp(key.replace(/\[/g, '\\[').replace(/\]/g, '\\]').replace(/\./g, '\\.'), 'g'), value);
    }
    fs.writeFileSync(p, content);
  }
}
console.log('done');
