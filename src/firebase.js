import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, getRedirectResult, onAuthStateChanged, signOut } from 'firebase/auth';
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
// survive. Redirect only for the installed home-screen PWA, where iOS blocks
// popups outright.
const isStandalone =
  typeof window !== 'undefined' &&
  (window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches);

export function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return isStandalone ? signInWithRedirect(auth, provider) : signInWithPopup(auth, provider);
}
export function signOutUser() {
  return signOut(auth);
}
getRedirectResult(auth).catch((err) => console.error('Google sign-in redirect failed:', err));

export function subscribeAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

export async function getMessagingIfSupported() {
  if (!(await messagingIsSupported())) return null;
  return getMessaging(app);
}
