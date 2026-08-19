import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

initializeApp();

const TZ = 'Europe/Brussels';

// Runs every hour; each user only gets pinged once, at their own
// reminderHour, and only if they haven't already logged the day —
// a client can't reliably self-schedule a push once the tab is closed,
// so this is the one part of the app that has to live server-side.
export const dailyReminder = onSchedule({ schedule: 'every 1 hours', timeZone: TZ }, async () => {
  const db = getFirestore();
  const messaging = getMessaging();
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
      } catch (err) {
        console.error(`reminder failed for ${userDoc.id}:`, err.message);
      }
    })
  );
});
