import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const DB_NAME = "ai-studio-aaravadvisorsoms-475ddba0-ae7a-423a-a707-7aaa0debfad2";

let firestoreDb;
try {
  // Initialize Firestore with multi-tab IndexedDB offline persistence
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  }, DB_NAME);
} catch {
  try {
    firestoreDb = getFirestore(app, DB_NAME);
  } catch {
    firestoreDb = getFirestore(app);
  }
}
export const db = firestoreDb;
export const storage = getStorage(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send'
];

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

