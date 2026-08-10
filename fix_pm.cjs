const fs = require('fs');
let content = fs.readFileSync('src/components/OrderWizard.tsx', 'utf-8');

content = content.replace(
  `const [paymentMethod, setPaymentMethod] = useState('wallet');`,
  `const [paymentMethod, setPaymentMethod] = useState(isGuest ? 'card' : 'wallet');`
);

// We should also replace the payment method text in processFinalOrder
content = content.replace(
  `paymentMethod: shipmentData.receiverPaymentMode === 'card' ? 'Card on Delivery' : 'Cash on Delivery',`,
  `paymentMethod: paymentMethod === 'card' ? 'Credit Card (Stripe)' : 'USend Wallet',`
);

fs.writeFileSync('src/components/OrderWizard.tsx', content);
