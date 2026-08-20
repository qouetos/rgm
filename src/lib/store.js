import { doc, setDoc, getDoc, deleteDoc, collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
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
export function customItemsRef(uid) {
  return collection(db, 'users', uid, 'customItems');
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

// A user-grown catalog of dishes ("Mes plats") and drinks, usable from any
// meal moment — kind is 'food' | 'drink'. Kept as one collection since both
// are just labeled, optionally-caloried items picked from the same kind of
// chip list.
export function watchCustomItems(uid, cb, onError) {
  return onSnapshot(
    customItemsRef(uid),
    (snap) => {
      const rows = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.label.localeCompare(b.label));
      cb(rows);
    },
    (err) => onError?.(err)
  );
}

export async function saveCustomItem(uid, { kind, label, kcal }) {
  const ref = await addDoc(customItemsRef(uid), {
    kind,
    label,
    kcal: typeof kcal === 'number' && !Number.isNaN(kcal) ? kcal : null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function requestTestNotification(uid) {
  const ref = await addDoc(collection(db, 'users', uid, 'testRequests'), { requestedAt: serverTimestamp() });
  return ref.id;
}

// Watches one specific request doc so the caller can see whether the worker
// ever picked it up, not just whether the write succeeded.
export function watchTestRequest(uid, requestId, cb, onError) {
  return onSnapshot(
    doc(db, 'users', uid, 'testRequests', requestId),
    (snap) => cb(snap.exists() ? snap.data() : null),
    (err) => onError?.(err)
  );
}

export function deleteTestRequest(uid, requestId) {
  return deleteDoc(doc(db, 'users', uid, 'testRequests', requestId));
}

// No orderBy/limit in the query itself — sorting client-side avoids needing
// a Firestore index entirely, which is fine at this scale (one user, a few
// hundred documents over 8 months).
export function watchRecentWeighIns(uid, count, cb, onError) {
  return onSnapshot(
    collection(db, 'users', uid, 'weighIns'),
    (snap) => {
      const rows = snap.docs
        .map((d) => ({ date: d.id, ...d.data() }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-count);
      cb(rows);
    },
    (err) => onError?.(err)
  );
}

export function watchRecentDays(uid, count, cb, onError) {
  return onSnapshot(
    collection(db, 'users', uid, 'days'),
    (snap) => {
      const rows = snap.docs
        .map((d) => ({ date: d.id, ...d.data() }))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, count);
      cb(rows);
    },
    (err) => onError?.(err)
  );
}
