importScripts(
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js'
);

firebase.initializeApp({
  apiKey: '__VITE_FIREBASE_API_KEY__',
  authDomain: '__VITE_FIREBASE_AUTH_DOMAIN__',
  projectId: '__VITE_FIREBASE_PROJECT_ID__',
  storageBucket: '__VITE_FIREBASE_STORAGE_BUCKET__',
  messagingSenderId: '__VITE_FIREBASE_MESSAGING_SENDER_ID__',
  appId: '__VITE_FIREBASE_APP_ID__',
});

const messaging = firebase.messaging();

// Fires for DATA-ONLY payloads when app is backgrounded
// If server sends { notification: {...} }, FCM auto-displays — this won't fire
messaging.onBackgroundMessage(payload => {
  const data = payload.data || {};
  const notif = payload.notification || {};

  const title = data.title || notif.title || 'New Notification';
  const body = data.body || notif.body || '';
  const icon = data.icon || notif.icon || '/favicon.ico';
  const tag = data.tag || notif.tag || 'default-tag';

  // Forward push data to all open app tabs for toast/badge update
  self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then(clientList => {
      clientList.forEach(client => {
        client.postMessage({ type: 'PUSH_RECEIVED', data });
      });
    });

  return self.registration.showNotification(title, {
    body,
    icon,
    badge: '/favicon.ico',
    tag,
    renotify: true,
    data: { ...data, click_action: data.click_action || notif.click_action },
  });
});

// Notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const clickAction = event.notification.data?.click_action;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // If target URL already open, focus it
        if (clickAction) {
          for (const client of clientList) {
            if (client.url === clickAction && 'focus' in client) {
              return client.focus();
            }
          }
          return clients.openWindow(clickAction);
        }

        // Otherwise focus any existing window
        for (const client of clientList) {
          if ('focus' in client) return client.focus();
        }
        return clients.openWindow('/');
      })
  );
});

// Re-subscribe if push subscription expires
self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe({ userVisibleOnly: true })
      .then(() => {
        // Token will be re-fetched by the app on next load
      })
      .catch(err => console.error('[SW] Resubscribe failed:', err))
  );
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
