import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
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

// Plain email/password — a direct API call, no popup or redirect, so it
// works identically in a normal tab and in the installed iOS home-screen
// app (where Google's OAuth flow can't complete: no popups allowed there,
// and the standalone context's storage is isolated from Safari's, so a
// redirect through accounts.google.com never finds its way back to a
// recognized session).
export function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}
export function signUp(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
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
