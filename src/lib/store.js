import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase.js';

export const todayKey = (d = new Date()) => d.toISOString().slice(0, 10);

export function profileRef(uid) {
  return doc(db, 'users', uid);
}
export function weighInRef(uid, dateKey) {
  return doc(db, 'users', uid, 'weighIns', dateKey);
}
export function dayRef(uid, dateKey) {
  return doc(db, 'users', uid, 'days', dateKey);
}

export async function getProfile(uid) {
  const snap = await getDoc(profileRef(uid));
  return snap.exists() ? snap.data() : null;
}

export function saveProfile(uid, profile) {
  return setDoc(profileRef(uid), profile, { merge: true });
}

export function watchProfile(uid, cb, onError) {
  return onSnapshot(
    profileRef(uid),
    (snap) => cb(snap.exists() ? snap.data() : null),
    (err) => onError?.(err)
  );
}

export function saveWeighIn(uid, weightKg, dateKey = todayKey()) {
  return setDoc(
    weighInRef(uid, dateKey),
    { weight: weightKg, loggedAt: serverTimestamp() },
    { merge: true }
  );
}

export function saveDay(uid, entry, dateKey = todayKey()) {
  return setDoc(dayRef(uid, dateKey), { ...entry, loggedAt: serverTimestamp() }, { merge: true });
}

export function watchRecentWeighIns(uid, count, cb, onError) {
  const q = query(collection(db, 'users', uid, 'weighIns'), orderBy('__name__', 'desc'), limit(count));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ date: d.id, ...d.data() })).reverse();
      cb(rows);
    },
    (err) => onError?.(err)
  );
}

export function watchRecentDays(uid, count, cb, onError) {
  const q = query(collection(db, 'users', uid, 'days'), orderBy('__name__', 'desc'), limit(count));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ date: d.id, ...d.data() }))),
    (err) => onError?.(err)
  );
}
