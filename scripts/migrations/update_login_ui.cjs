const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf-8');

if (!code.includes('signInAnonymously')) {
  code = code.replace(
    "import { ShieldAlert, Lock, CheckCircle2, X } from 'lucide-react';",
    "import { ShieldAlert, Lock, CheckCircle2, X } from 'lucide-react';\nimport { auth } from '../lib/firebase';\nimport { signInAnonymously } from 'firebase/auth';"
  );
  
  code = code.replace(
    /const response = await fetch\('\/api\/auth\/login', \{/,
    `const cred = await signInAnonymously(auth);\n      const response = await fetch('/api/auth/login', {`
  );
  
  code = code.replace(
    /body: JSON\.stringify\(\{ email, password, role: selectedRole \}\)/,
    `body: JSON.stringify({ email, password, role: selectedRole, uid: cred.user.uid })`
  );
  
  fs.writeFileSync('src/pages/Login.tsx', code);
}
