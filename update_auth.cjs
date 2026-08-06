const fs = require('fs');

function updateAuthFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  
  // Clean up previous wrong replacement if any
  content = content.replace(/const \{ signInAnonymously \} = require\('firebase\/auth'\);/g, '');
  content = content.replace(/const \{ doc, setDoc \} = require\('firebase\/firestore'\);/g, '');

  const replaceTarget = /setUser\(\{\s*uid:\s*'demo-fallback-uid'[\s\S]*?\}\);/g;
  
  let newContent = content.replace(replaceTarget, `try {
          const anonCred = await signInAnonymously(auth);
          await setDoc(doc(db, 'users', anonCred.user.uid), {
             uid: anonCred.user.uid,
             email: loginEmail || email,
             role: targetRole,
             createdAt: new Date().toISOString()
          });
          // setUser is handled by onAuthStateChanged in AppContext!
        } catch (anonErr) {
          console.error("Anon sign in failed:", anonErr);
        }`);
  
  if (path.includes('LandingPage.tsx')) {
    newContent = newContent.replace(/loginEmail \|\| email/g, 'loginEmail');
  } else {
    newContent = newContent.replace(/loginEmail \|\| email/g, 'email');
  }
  
  // ensure we have imports!
  if (!newContent.includes('signInAnonymously')) {
     newContent = newContent.replace(/import \{.*?\} from 'firebase\/auth';/, (match) => {
       if (!match.includes('signInAnonymously')) {
         return match.replace('}', ', signInAnonymously }');
       }
       return match;
     });
  }
  if (!newContent.includes('setDoc')) {
     newContent = newContent.replace(/import \{.*?\} from 'firebase\/firestore';/, (match) => {
       if (!match.includes('setDoc')) {
         return match.replace('}', ', setDoc }');
       }
       return match;
     });
  }

  fs.writeFileSync(path, newContent, 'utf8');
  return true;
}

['src/screens/Login.tsx', 'src/components/LoginModal.tsx', 'src/screens/LandingPage.tsx'].forEach(p => {
  if (fs.existsSync(p)) {
    if (updateAuthFile(p)) {
      console.log("Updated", p);
    }
  }
});
