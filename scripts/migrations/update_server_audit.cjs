const fs = require('fs');
let serverContent = fs.readFileSync('server.ts', 'utf-8');

// Add import
if (!serverContent.includes('import { db } from "./src/lib/firebase-admin";')) {
  serverContent = serverContent.replace(
    'import express from "express";',
    'import express from "express";\nimport { db } from "./src/lib/firebase-admin";'
  );
}

// Intercept auditLogsStore.unshift
serverContent = serverContent.replace(
  /auditLogsStore\.unshift\(([^)]+)\);/g,
  "auditLogsStore.unshift($1);\n  try { db.collection('audit_logs').doc($1.id).set($1); } catch (e) { console.error('Firebase DB error:', e); }"
);

fs.writeFileSync('server.ts', serverContent);
