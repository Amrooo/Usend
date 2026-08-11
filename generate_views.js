const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'src/screens/admin/views');
if (!fs.existsSync(viewsDir)) {
  fs.mkdirSync(viewsDir, { recursive: true });
}

const views = ['AdminOverview', 'AdminOperations', 'AdminCouriers', 'AdminMerchants', 'AdminPricing', 'AdminExceptions', 'AdminSettings'];

views.forEach(view => {
  const content = `import React from 'react';
import { motion } from 'motion/react';

export default function ${view}() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8"
    >
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">${view.replace('Admin', '')}</h1>
      <p className="text-zinc-500">This module is under construction.</p>
    </motion.div>
  );
}
`;
  fs.writeFileSync(path.join(viewsDir, `${view}.tsx`), content);
});
console.log('Created admin views');
