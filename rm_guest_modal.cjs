const fs = require('fs');
const path = 'src/screens/LandingPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const startModal = '{/* GUEST ORDER WIZARD MODAL */}';
const endModal = '      </AnimatePresence>\\n\\n      {/* BOT CHAT WIDGET */}';

const startIndex = content.indexOf(startModal);
const endIndex = content.indexOf('{/* BOT CHAT WIDGET */}');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + content.substring(endIndex);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Removed Guest modal");
} else {
  console.log("Could not find guest modal to remove");
}
