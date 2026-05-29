const fs = require('fs');
const content = fs.readFileSync('src/screens/merchant/MerchantIndividualOrder.tsx', 'utf8');
const unified = content
  .replace(/MerchantIndividualOrder/g, 'UserIndividualOrder')
  .replace(/import MerchantSidebar.*/, 'import UserSidebar from \'../../components/UserSidebar\';')
  .replace(/<MerchantSidebar currentScreen="merchant_individual" onNavigate={onNavigate} \/>/, '<UserSidebar currentScreen="user_individual" onNavigate={onNavigate} />')
  .replace(/Merchant Sidebar/, 'User Sidebar')
  .replace(/merchantActiveTab/g, 'merchantActiveTab') // keep it reading from context, maybe rename but unnecessary
  .replace(/merchant_tracking/g, 'user_tracking');

fs.writeFileSync('src/screens/user/UserIndividualOrder.tsx', unified);
console.log('Unification complete!');
