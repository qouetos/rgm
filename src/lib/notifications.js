import { getToken, onMessage } from 'firebase/messaging';
import { getMessagingIfSupported } from '../firebase.js';
import { saveProfile } from './store.js';

// The daily reminder itself is sent by a scheduled Cloud Function
// (functions/index.js) — this only registers the device to receive it.
export async function enableReminders(uid, reminderHour) {
  if (typeof Notification === 'undefined') throw new Error('unsupported');

  // Requested before any other await: Safari ties the permission prompt to
  // the click that triggered this call, and an await ahead of it can break
  // that link silently (no prompt, permission stays 'default').
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('denied');

  const messaging = await getMessagingIfSupported();
  if (!messaging) throw new Error('unsupported');

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  await saveProfile(uid, { fcmToken: token, reminderHour });
  return token;
}

export async function watchForegroundMessages(cb) {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return () => {};
  return onMessage(messaging, cb);
}
