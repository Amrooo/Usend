const fs = require('fs');

['src/screens/Login.tsx', 'src/components/LoginModal.tsx', 'src/screens/LandingPage.tsx'].forEach(p => {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    
    // add signInAnonymously
    if (!content.includes('signInAnonymously')) {
      content = content.replace(/import \{.*?signInWithEmailAndPassword.*?\} from 'firebase\/auth';/, (match) => {
        return match.replace('}', ', signInAnonymously }');
      });
    }

    // add setDoc, doc
    if (!content.includes('setDoc')) {
      if (content.includes("from 'firebase/firestore'")) {
        content = content.replace(/import \{.*?\} from 'firebase\/firestore';/, (match) => {
          let m = match;
          if (!m.includes('setDoc')) m = m.replace('}', ', setDoc }');
          if (!m.includes('doc')) m = m.replace('}', ', doc }');
          return m;
        });
      } else {
        content = "import { doc, setDoc } from 'firebase/firestore';\n" + content;
      }
    }
    
    // Check if db is imported
    if (content.includes('doc(db') && !content.includes('import {') && !content.includes('db }')) {
      // Need to add db import
      if (content.includes("from '../firebase'")) {
        content = content.replace(/import \{.*?\} from '\.\.\/firebase';/, (match) => {
          let m = match;
          if (!m.includes('db')) m = m.replace('}', ', db }');
          if (!m.includes('auth')) m = m.replace('}', ', auth }');
          return m;
        });
      } else {
         content = "import { db, auth } from '../firebase';\n" + content;
      }
    }

    fs.writeFileSync(p, content, 'utf8');
  }
});
