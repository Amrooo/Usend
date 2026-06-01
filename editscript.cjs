const fs = require('fs');

const path = './src/components/GuestOrderWidget.tsx';
let content = fs.readFileSync(path, 'utf8');

// replace inputs for countries/cities with selects
content = content.replace(
  '<label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">{isRTL ? "الدولة" : "Country"} <span className="text-brand">*</span></label>',
  '<label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">{isRTL ? "الدولة" : "Country"} <span className="text-brand">*</span></label>'
)

// actually, let's just use regular expressions or multi_edit_file!
