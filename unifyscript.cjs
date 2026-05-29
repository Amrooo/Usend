const fs = require('fs');
let content = fs.readFileSync('src/screens/merchant/MerchantIndividualOrder.tsx', 'utf8');
content = content
  .replace(/MerchantIndividual/g, 'UserIndividual')
  .replace(/merchant_individual/g, 'user_individual')
  .replace(/MerchantSidebar/g, 'UserSidebar')
  .replace(/merchantActiveTab/g, 'merchantActiveTab')
  .replace(/setMerchantActiveTab/g, 'setMerchantActiveTab')
  .replace(/merchantPhoto/g, 'userPhoto')
  .replace(/setMerchantPhoto/g, 'setUserPhoto')
  .replace(/isAnalyzingMerchantItem/g, 'isAnalyzingUserItem')
  .replace(/setIsAnalyzingMerchantItem/g, 'setIsAnalyzingUserItem')
  .replace(/merchantAIResult/g, 'userAIResult')
  .replace(/setMerchantAIResult/g, 'setUserAIResult')
  .replace(/analyzeMerchantItemWithAI/g, 'analyzeUserItemWithAI')
  .replace(/handleMerchantPhotoUpload/g, 'handleUserPhotoUpload')
  .replace(/'merchant_tracking'/g, "'user_tracking'")
  .replace(/'merchant_batch'/g, "'user_dashboard'")
  .replace(/Merchant Access/g, 'User Access')
  .replace(/Merchant Order/g, 'User Order');

fs.writeFileSync('src/screens/user/UserIndividualOrder.tsx', content);
console.log('Unification complete!');
