const fs = require('fs');
const path = 'src/screens/LandingPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const start = '{/* GUEST ORDER WIZARD MODAL */}';
const end = '{/* FLOAT CHATBOT DIALOGUE - SwiftMove AI */}';
const idxStart = content.indexOf(start);
const idxEnd = content.indexOf(end);

if (idxStart !== -1 && idxEnd !== -1) {
    content = content.substring(0, idxStart) + content.substring(idxEnd);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Removed guest modal component block");
}
