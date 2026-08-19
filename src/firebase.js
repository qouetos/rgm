import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from 'firebase/auth';
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

// Redirect (not popup) — popups are unreliable inside a standalone/home-screen
// PWA on iOS. getRedirectResult just needs to be called once so a failed
// redirect surfaces an error instead of silently doing nothing.
export function signInWithGoogle() {
  return signInWithRedirect(auth, new GoogleAuthProvider());
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
