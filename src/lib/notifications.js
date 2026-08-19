import { getToken, onMessage } from 'firebase/messaging';
import { getMessagingIfSupported } from '../firebase.js';
import { saveProfile } from './store.js';

// The daily reminder itself is sent by a scheduled Cloud Function
// (functions/index.js) — this only registers the device to receive it.
export async function enableReminders(uid, reminderHour) {
  const messaging = await getMessagingIfSupported();
  if (!messaging) throw new Error('unsupported');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('denied');

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
