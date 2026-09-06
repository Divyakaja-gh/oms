const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  /id: \`usr_\$\{Date\.now\(\)\}\`,/,
  `id: req.body.uid || \`usr_\$\{Date.now()\}\`,`
);

fs.writeFileSync('server.ts', code);
