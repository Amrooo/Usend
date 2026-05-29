const fs = require('fs');

let content = fs.readFileSync('src/screens/merchant/MerchantPayments.tsx', 'utf8');

// Default tab change
content = content.replace(/const isStatements = merchantActiveTab === 'statements';/, "const isStatements = merchantActiveTab === 'statements' || !merchantActiveTab || (merchantActiveTab !== 'cod' && merchantActiveTab !== 'tax' && merchantActiveTab !== 'freight_invoices' && merchantActiveTab !== 'warehouse_invoices');");

// Let's just remove the default wallet layout.
// From `{!isStatements && !isCOD ...` to `) : isStatements ? (`
let startIndex = content.indexOf('          {!isStatements && !isCOD && !isTax && !isFreightInvoices && !isWarehouseInvoices ? (');
let endIndex = content.indexOf('          ) : isStatements ? (');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + '          {isStatements ? (' + content.substring(endIndex + '          ) : isStatements ? ('.length);
}

// Remove the `showAddFunds` modal at the bottom
let modalStart = content.indexOf('{/* Top-up Modal */}');
let mainEnd = content.indexOf('      </main>');

if (modalStart !== -1 && mainEnd !== -1 && modalStart > mainEnd) {
   let modalEnd = content.indexOf('    </div>', modalStart);
   content = content.substring(0, modalStart) + '    </div>\n  );\n}';
}

fs.writeFileSync('src/screens/merchant/MerchantPayments.tsx', content);
console.log('Removed Wallet from MerchantPayments.');
