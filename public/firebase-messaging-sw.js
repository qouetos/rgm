// Background push handler. Loaded as a classic script (not a module), so it
// can't read Vite env vars — the config below is the public web app config
// (safe to expose; Firestore security rules do the actual access control).
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyA0F1wjmbRG_ct1eEILrKt463yQeymiz5g',
  authDomain: 'rgme-b8a64.firebaseapp.com',
  projectId: 'rgme-b8a64',
  storageBucket: 'rgme-b8a64.firebasestorage.app',
  messagingSenderId: '560731309674',
  appId: '1:560731309674:web:d89daf573c189a464f6c13',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'Cap', {
    body: body || "N'oublie pas d'encoder ta journée.",
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  });
});
