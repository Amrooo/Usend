const fs = require('fs');

let merchant = fs.readFileSync('src/screens/merchant/MerchantDashboard.tsx', 'utf8');

merchant = merchant.replace(
  `const stats = [`,
  `const totalRev = merchantRequests.reduce((sum, req) => sum + parseFloat(req.orderAmount?.replace(/[^0-9.]/g, '') || '0'), 0);
  const platformFees = totalRev * 0.05;

  const stats = [`
);

merchant = merchant.replace(
  `value: (1248 + merchantRequests.length).toLocaleString()`,
  `value: merchantRequests.length.toLocaleString()`
);

merchant = merchant.replace(
  `value: merchantRequests.filter(o => o.status !== 'delivered').length.toString()`,
  `value: merchantRequests.filter(o => o.status !== 'delivered').length.toString()`
);

merchant = merchant.replace(
  `value: 'AED 12,450'`,
  `value: \`AED \${totalRev.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}\``
);

merchant = merchant.replace(
  `value: 'AED 622'`,
  `value: \`AED \${platformFees.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}\``
);

fs.writeFileSync('src/screens/merchant/MerchantDashboard.tsx', merchant);

let user = fs.readFileSync('src/screens/user/UserDashboard.tsx', 'utf8');

user = user.replace(
  `const stats = [`,
  `const totalSpent = myRequests.reduce((sum, req) => sum + parseFloat(req.orderAmount?.replace(/[^0-9.]/g, '') || '0'), 0);

  const stats = [`
);

user = user.replace(
  `value: (24 + myRequests.length).toLocaleString()`,
  `value: myRequests.length.toLocaleString()`
);

user = user.replace(
  `value: myRequests.filter(o => o.status !== 'delivered').length.toString()`,
  `value: myRequests.filter(o => o.status !== 'delivered').length.toString()`
);

user = user.replace(
  `value: 'AED 450'`,
  `value: \`AED \${totalSpent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}\``
);

user = user.replace(/const previousOrders = \[\s*\{.*?\}\s*\];/s, `const previousOrders = myRequests.filter(req => req.status === 'delivered');`);

fs.writeFileSync('src/screens/user/UserDashboard.tsx', user);
