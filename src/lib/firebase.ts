import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyAjz9J3HI271VGpdFpiBsc8y5AevBnocdE',
  authDomain: 'vive-brasil-pass-66dc0.firebaseapp.com',
  projectId: 'vive-brasil-pass-66dc0',
  storageBucket: 'vive-brasil-pass-66dc0.firebasestorage.app',
  messagingSenderId: '747637659291',
  appId: '1:747637659291:web:7e670c13658021b19e983e'
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
