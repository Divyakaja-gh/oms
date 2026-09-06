const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf-8');

// Inject firebase auth
if (!code.includes('import { signInAnonymously } from')) {
  code = code.replace(
    "import { ShieldAlert, Lock, CheckCircle2, X } from 'lucide-react';",
    "import { ShieldAlert, Lock, CheckCircle2, X } from 'lucide-react';\nimport { auth } from '../lib/firebase';\nimport { signInAnonymously } from 'firebase/auth';"
  );
}

// Update handleSubmit
code = code.replace(
  /const handleSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?e\.preventDefault\(\);[\s\S]*?setIsLoading\(true\);[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?const user: User = \{[\s\S]*?id: '[^']*',[\s\S]*?name: '[^']*',[\s\S]*?email,[\s\S]*?role: selectedRole,[\s\S]*?\};[\s\S]*?onLogin\(user\);[\s\S]*?\}, 1500\);[\s\S]*?\};/,
  `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const cred = await signInAnonymously(auth);
      const user: User = {
        id: cred.user.uid,
        name: 'Mock User',
        email,
        role: selectedRole,
      };
      onLogin(user);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };`
);

fs.writeFileSync('src/pages/Login.tsx', code);
