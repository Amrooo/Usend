const fs = require('fs');
let file = fs.readFileSync('src/screens/merchant/MerchantDashboard.tsx', 'utf8');

file = file.replace(
  /<td className="p-8 text-red-500 opacity-60" dir="ltr">-AED 5\.00<\/td>/g,
  `<td className="p-8 text-red-500 opacity-60" dir="ltr">-AED {((parseFloat(order.orderAmount?.replace(/[^0-9.]/g, '') || '0')) * 0.05).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>`
);

fs.writeFileSync('src/screens/merchant/MerchantDashboard.tsx', file);
