import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported as messagingIsSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Popup in a real browser tab — it stays in one origin/session so it isn't
// affected by Firefox/Safari partitioning the storage that a full redirect
// through accounts.google.com and the firebaseapp.com auth handler needs to
// survive. In the installed home-screen PWA, iOS isolates the standalone
// context enough that even the redirect flow loops back signed-out — so we
// don't attempt Google auth there at all; see openInSafari() below.
export const isStandalone =
  typeof window !== 'undefined' &&
  (window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches);

export function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}
export function signOutUser() {
  return signOut(auth);
}

export function subscribeAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

export async function getMessagingIfSupported() {
  if (!(await messagingIsSupported())) return null;
  return getMessaging(app);
}
