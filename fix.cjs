const fs = require('fs');
let content = fs.readFileSync('src/components/OrderWizard.tsx', 'utf-8');

content = content.replace(
  `                 {!isGuest && ( <label className={\`flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all \${paymentMethod === 'wallet' ? 'border-brand bg-brand/5' : 'border-zinc-200'}\`}> )}\n                   <input type="radio" checked={paymentMethod === 'wallet'} onChange={() => setPaymentMethod('wallet')} className="w-5 h-5 accent-brand" />\n                   <div><span className="font-bold uppercase text-sm block">USend Wallet</span><span className="text-xs text-zinc-500">Pay using your balance</span></div>\n                 </label>`,
  `                 {!isGuest && (\n                   <label className={\`flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all \${paymentMethod === 'wallet' ? 'border-brand bg-brand/5' : 'border-zinc-200'}\`}>\n                     <input type="radio" checked={paymentMethod === 'wallet'} onChange={() => setPaymentMethod('wallet')} className="w-5 h-5 accent-brand" />\n                     <div><span className="font-bold uppercase text-sm block">USend Wallet</span><span className="text-xs text-zinc-500">Pay using your balance</span></div>\n                   </label>\n                 )}`
);

fs.writeFileSync('src/components/OrderWizard.tsx', content);
