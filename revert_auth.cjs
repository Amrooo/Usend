const fs = require('fs');

function revertAuthFile(path) {
  let content = fs.readFileSync(path, 'utf8');

  // Replace signInAnonymously block with the demo-fallback-uid logic
  const replaceTarget = /try\s*\{\s*const\s*anonCred\s*=\s*await\s*signInAnonymously\(auth\);\s*await\s*setDoc\(doc\(db,\s*'users',\s*anonCred\.user\.uid\),\s*\{\s*uid:\s*anonCred\.user\.uid,\s*email:\s*(loginEmail \|\| email|email|loginEmail),\s*role:\s*targetRole,\s*createdAt:\s*new\s*Date\(\)\.toISOString\(\)\s*\}\);\s*\/\/\s*setUser\s*is\s*handled\s*by\s*onAuthStateChanged\s*in\s*AppContext!\s*\}\s*catch\s*\(anonErr\)\s*\{\s*console\.error\("Anon\s*sign\s*in\s*failed:",\s*anonErr\);\s*\}/g;
  
  content = content.replace(replaceTarget, `setUser({
          uid: 'demo-fallback-uid',
          email: email || loginEmail || 'demo@usend.com',
          role: targetRole,
          name: 'Demo User',
        });`);

  // We should also replace the email variable properly if it's LandingPage vs others.
  // In LandingPage, it's loginEmail. In Login/LoginModal it's email.
  if (path.includes('LandingPage')) {
    content = content.replace(/email \|\| loginEmail \|\| 'demo@usend.com'/g, 'loginEmail');
  } else {
    content = content.replace(/email \|\| loginEmail \|\| 'demo@usend.com'/g, 'email');
  }

  fs.writeFileSync(path, content, 'utf8');
  return true;
}

['src/screens/Login.tsx', 'src/components/LoginModal.tsx', 'src/screens/LandingPage.tsx'].forEach(p => {
  if (fs.existsSync(p)) {
    revertAuthFile(p);
    console.log("Reverted", p);
  }
});
