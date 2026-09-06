import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

export const TARGET_FIRESTORE_DATABASE_ID = 'ai-studio-aaravadvisorsoms-475ddba0-ae7a-423a-a707-7aaa0debfad2';
let projectId = 'sbconnect-65338';
let databaseId = TARGET_FIRESTORE_DATABASE_ID;

try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (raw.projectId) projectId = raw.projectId;
    if (raw.firestoreDatabaseId) databaseId = raw.firestoreDatabaseId;
  }
} catch {
  // Use fallbacks
}

// Guard against falling back to '(default)' instance to prevent audit writes landing in wrong database
if (!databaseId || databaseId === '(default)') {
  databaseId = TARGET_FIRESTORE_DATABASE_ID;
}

let rawDb: any = null;
let rawAuth: any = null;

try {
  if (!getApps().length) {
    initializeApp({
      projectId,
    });
  }
  const app = getApps()[0];
  rawDb = getFirestore(app, databaseId);
  rawAuth = getAuth(app);
  console.log(`[Firebase Admin] Targeted Firestore database '${databaseId}' (matching client) in project '${projectId}'`);
} catch (err: any) {
  console.warn('[Firebase Admin] Initialization note:', err?.message || err);
}

// Resilient wrapper to ensure no asynchronous unhandled promise rejections (like gRPC 7 PERMISSION_DENIED) crash the server
function wrapDocRef(docRef: any) {
  if (!docRef) return docRef;
  return new Proxy(docRef, {
    get(target, prop) {
      const orig = target[prop];
      if (typeof orig === 'function') {
        return function (...args: any[]) {
          try {
            const result = orig.apply(target, args);
            if (result && typeof result.then === 'function') {
              return result.catch((err: any) => {
                console.warn(`[Firebase Admin ${String(prop)}] Handled:`, err?.message || err);
                return { success: false, error: err?.message, handled: true };
              });
            }
            return result;
          } catch (err: any) {
            console.warn(`[Firebase Admin ${String(prop)} sync] Handled:`, err?.message || err);
            return Promise.resolve({ success: false, error: err?.message, handled: true });
          }
        };
      }
      return orig;
    }
  });
}

function wrapCollectionRef(colRef: any) {
  if (!colRef) return colRef;
  return new Proxy(colRef, {
    get(target, prop) {
      if (prop === 'doc') {
        return function (...args: any[]) {
          try {
            const docRef = target.doc(...args);
            return wrapDocRef(docRef);
          } catch {
            return wrapDocRef({
              set: () => Promise.resolve({ success: false, handled: true }),
              get: () => Promise.resolve({ exists: false, data: () => null }),
              update: () => Promise.resolve({ success: false, handled: true }),
              delete: () => Promise.resolve({ success: false, handled: true })
            });
          }
        };
      }
      const orig = target[prop];
      if (typeof orig === 'function') {
        return function (...args: any[]) {
          try {
            const result = orig.apply(target, args);
            if (result && typeof result.then === 'function') {
              return result.catch((err: any) => {
                console.warn(`[Firebase Admin col.${String(prop)}] Handled:`, err?.message || err);
                return { success: false, error: err?.message, handled: true };
              });
            }
            return result;
          } catch (err: any) {
            return Promise.resolve({ success: false, error: err?.message, handled: true });
          }
        };
      }
      return orig;
    }
  });
}

export const db: any = new Proxy(rawDb || {}, {
  get(target, prop) {
    if (prop === 'collection') {
      return function (...args: any[]) {
        try {
          if (target && typeof target.collection === 'function') {
            const col = target.collection(...args);
            return wrapCollectionRef(col);
          }
        } catch (e: any) {
          console.warn('[Firebase Admin collection] Fallback used:', e?.message || e);
        }
        return wrapCollectionRef({
          doc: () => ({
            set: () => Promise.resolve({ success: false, handled: true }),
            get: () => Promise.resolve({ exists: false, data: () => null }),
            update: () => Promise.resolve({ success: false, handled: true }),
            delete: () => Promise.resolve({ success: false, handled: true })
          }),
          add: () => Promise.resolve({ id: `doc_${Date.now()}`, success: false }),
          get: () => Promise.resolve({ docs: [], empty: true, size: 0 })
        });
      };
    }
    return target ? target[prop] : undefined;
  }
});

export const auth: any = rawAuth || {};

