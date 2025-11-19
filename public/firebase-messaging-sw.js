// Import Firebase scripts
importScripts(
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js'
);

// Default Firebase configuration (will be overridden by message from main thread)
let firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

let messaging = null;
let isFirebaseInitialized = false;

// Setup background message handler
function setupBackgroundMessageHandler() {
  if (!messaging) {
    console.warn(
      '[firebase-messaging-sw.js] Cannot setup background handler: messaging not initialized'
    );
    return;
  }

  try {
    messaging.onBackgroundMessage(payload => {
      console.log(
        '[firebase-messaging-sw.js] Received background message ',
        payload
      );

      const notificationTitle =
        payload.notification?.title || 'New Notification';
      const notificationOptions = {
        body: payload.notification?.body || '',
        icon: payload.notification?.icon || '/favicon.ico',
        badge: payload.notification?.badge || '/favicon.ico',
        image: payload.notification?.image,
        tag: payload.notification?.tag,
        data: payload.data,
        requireInteraction: false,
        silent: false,
      };

      return self.registration.showNotification(
        notificationTitle,
        notificationOptions
      );
    });

    console.log(
      '[firebase-messaging-sw.js] Background message handler set up successfully'
    );
  } catch (error) {
    console.error(
      '[firebase-messaging-sw.js] Error setting up background message handler:',
      error
    );
  }
}

// Initialize Firebase and messaging
function initializeFirebase(config) {
  if (isFirebaseInitialized) {
    console.log(
      '[firebase-messaging-sw.js] Firebase already initialized, skipping...'
    );
    // Ensure background handler is set up even if already initialized
    if (messaging) {
      setupBackgroundMessageHandler();
    }
    return;
  }

  // Check if config is valid (has required fields)
  if (
    !config.apiKey ||
    !config.projectId ||
    !config.messagingSenderId ||
    !config.appId
  ) {
    console.warn(
      '[firebase-messaging-sw.js] Firebase config is incomplete, waiting for valid config...'
    );
    return;
  }

  try {
    console.log('[firebase-messaging-sw.js] Initializing Firebase...');

    // Initialize Firebase with received config
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
      console.log('[firebase-messaging-sw.js] Firebase app initialized');
    } else {
      console.log('[firebase-messaging-sw.js] Firebase app already exists');
    }

    // Retrieve an instance of Firebase Messaging after initialization
    messaging = firebase.messaging();
    isFirebaseInitialized = true;

    console.log(
      '[firebase-messaging-sw.js] Firebase messaging initialized, setting up background handler...'
    );

    // Setup background message handler after messaging is initialized
    setupBackgroundMessageHandler();

    console.log('[firebase-messaging-sw.js] Firebase initialized successfully');
  } catch (error) {
    console.error(
      '[firebase-messaging-sw.js] Firebase initialization error:',
      error
    );
  }
}

// Listen for Firebase config from main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    console.log(
      '[firebase-messaging-sw.js] Received Firebase config from main thread'
    );
    firebaseConfig = event.data.config;
    initializeFirebase(firebaseConfig);
  }
});

// Log when service worker is installed/activated
self.addEventListener('install', event => {
  console.log('[firebase-messaging-sw.js] Service worker installed');
});

self.addEventListener('activate', event => {
  console.log('[firebase-messaging-sw.js] Service worker activated');
});

// Try to initialize with default config (in case config is already available)
// This handles the case where the service worker is installed before the message is sent
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  initializeFirebase(firebaseConfig);
}

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  // Handle custom click action if provided in payload
  const clickAction = event.notification.data?.click_action;
  if (clickAction) {
    event.waitUntil(clients.openWindow(clickAction));
  } else {
    // Focus or open the app
    event.waitUntil(
      clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Check if there's already a window/tab open with the target URL
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url === '/' && 'focus' in client) {
              return client.focus();
            }
          }
          // If not, open a new window/tab
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});
