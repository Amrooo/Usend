const fs = require('fs');

let file = fs.readFileSync('src/screens/merchant/MerchantTracking.tsx', 'utf8');

file = file.replace(
  `const activeOrders = merchantRequests;`,
  `const activeOrders = merchantRequests;
  const inTransitCount = activeOrders.filter(o => o.status === 'in_transit' || o.status === 'En-route').length;
  const pickedUpCount = activeOrders.filter(o => o.status === 'picked_up').length;
  const pendingCount = activeOrders.filter(o => o.status === 'assigning' || o.status === 'Pending' || o.status === 'Reviewing').length;`
);

file = file.replace(
  /<div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">1<\/div>/g,
  function(match, offset, str) {
    if (str.substring(offset - 100, offset).indexOf('in_transit') > -1) {
      return '<div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{inTransitCount}</div>';
    }
    if (str.substring(offset - 100, offset).indexOf('picked_up') > -1) {
      return '<div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{pickedUpCount}</div>';
    }
    if (str.substring(offset - 100, offset).indexOf('pending') > -1) {
      return '<div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{pendingCount}</div>';
    }
    return match; // fallback
  }
);

fs.writeFileSync('src/screens/merchant/MerchantTracking.tsx', file);
