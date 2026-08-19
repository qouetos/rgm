import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const TZ = 'Europe/Brussels';

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountJson) {
  console.error('FIREBASE_SERVICE_ACCOUNT env var is missing — see worker/README for how to set it.');
  process.exit(1);
}
initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });

const db = getFirestore();
const messaging = getMessaging();

// Runs every hour; each user only gets pinged once, at their own
// reminderHour, and only if they haven't already logged the day.
async function checkAndSendReminders() {
  const now = new Date();
  const currentHour = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: 'numeric', hour12: false }).format(now)
  );
  const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(now); // YYYY-MM-DD

  const usersSnap = await db.collection('users').get();
  await Promise.all(
    usersSnap.docs.map(async (userDoc) => {
      const { fcmToken, reminderHour } = userDoc.data();
      if (!fcmToken || reminderHour == null || Number(reminderHour) !== currentHour) return;

      const dayDoc = await userDoc.ref.collection('days').doc(todayKey).get();
      if (dayDoc.exists) return;

      try {
        await messaging.send({
          token: fcmToken,
          notification: {
            title: "N'oublie pas d'encoder ta journée",
            body: '30 secondes suffisent — même juste le poids.',
          },
          webpush: { fcmOptions: { link: '/' } },
        });
        console.log(`reminder sent to ${userDoc.id}`);
      } catch (err) {
        console.error(`reminder failed for ${userDoc.id}:`, err.message);
      }
    })
  );
}

function msUntilNextHour() {
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return next - now;
}

checkAndSendReminders().catch((err) => console.error('initial check failed:', err));
setTimeout(function tick() {
  checkAndSendReminders().catch((err) => console.error('scheduled check failed:', err));
  setInterval(() => {
    checkAndSendReminders().catch((err) => console.error('scheduled check failed:', err));
  }, 60 * 60 * 1000);
}, msUntilNextHour());

console.log('reminder worker started, checking hourly');
