# Firebase Cloud Messaging (FCM) Integration

This directory contains the Firebase Cloud Messaging integration for browser push notifications.

## Overview

The FCM integration provides:

- **Permission Management**: Request and handle notification permissions
- **Foreground Notifications**: Display notifications when the app is in the foreground
- **Background Notifications**: Handle notifications when the app is in the background (via service worker)
- **Token Management**: Get and store FCM tokens for sending notifications
- **Cross-Browser Support**: Works on Chrome, Edge, Firefox, and other modern browsers

## Components

### NotificationManager

Main component that manages the notification flow. Handles:

- Automatic permission requests (optional)
- Permission status tracking
- Modal display for permission requests and success states

### NotificationPermissionModal

Modal component that requests notification permission from the user.

### NotificationEnabledModal

Success modal shown after notifications are enabled.

## Usage

### Basic Integration

```tsx
import NotificationManager from './components/notifications/notification-manager.component';
import { type MessagePayload } from 'firebase/messaging';

function App() {
  const handleNotificationReceived = (payload: MessagePayload) => {
    // Handle notification
    console.log('Notification:', payload);
  };

  const handlePermissionGranted = (token: string) => {
    // Send token to your backend
    // await api.saveFCMToken(token);
  };

  return (
    <div>
      <NotificationManager
        autoRequest={true}
        requestDelay={2000}
        onNotificationReceived={handleNotificationReceived}
        onPermissionGranted={handlePermissionGranted}
        onPermissionDenied={() => console.log('Permission denied')}
      />
      {/* Your app content */}
    </div>
  );
}
```

### Using the FCM Hook Directly

```tsx
import useFCM from './hooks/useFCM';
import { type MessagePayload } from 'firebase/messaging';

function MyComponent() {
  const { isInitialized, isPermissionGranted, token, requestPermission } =
    useFCM((payload: MessagePayload) => {
      // Handle notification
    });

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  return (
    <div>
      {isPermissionGranted ? (
        <p>Notifications enabled! Token: {token}</p>
      ) : (
        <button onClick={handleRequestPermission}>Enable Notifications</button>
      )}
    </div>
  );
}
```

### Using the FCM Service Directly

```tsx
import fcmService from './services/fcm.service';

// Initialize
await fcmService.initialize({
  onTokenReceived: token => {
    console.log('Token:', token);
  },
  onMessageReceived: payload => {
    console.log('Message:', payload);
  },
});

// Request permission
const token = await fcmService.requestPermission();

// Check permission
const permission = await fcmService.checkPermission();
```

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_VAPID_KEY=your_firebase_vapid_key
```

### Getting Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (gear icon)
4. Under "Your apps", select your web app
5. Copy the configuration values
6. For VAPID key, go to Cloud Messaging tab and copy the Web Push certificates key

## Service Worker

The service worker (`public/firebase-messaging-sw.js`) handles background notifications. It's automatically registered when FCM is initialized.

## Browser Support

- ✅ Chrome (desktop & mobile)
- ✅ Edge (desktop & mobile)
- ✅ Firefox (desktop & mobile)
- ✅ Safari (limited support - requires user interaction)
- ⚠️ Opera (should work, but not extensively tested)

## Testing

### Local Testing

1. Ensure your app is served over HTTPS (or localhost)
2. Configure Firebase environment variables
3. Install Firebase: `yarn add firebase`
4. Start the app: `yarn dev`
5. The permission modal should appear after 2 seconds (if `autoRequest={true}`)

### Sending Test Notifications

You can send test notifications from:

1. Firebase Console → Cloud Messaging → Send test message
2. Your backend API using the FCM token

### Testing Background Notifications

1. Grant notification permission
2. Minimize the browser or switch tabs
3. Send a notification from Firebase Console
4. The notification should appear even when the app is in the background

## Troubleshooting

### Notifications not working

1. Check browser console for errors
2. Verify Firebase configuration is correct
3. Ensure service worker is registered (check DevTools → Application → Service Workers)
4. Check notification permissions in browser settings

### Service Worker not registering

1. Ensure the app is served over HTTPS (or localhost)
2. Check browser console for service worker errors
3. Verify `firebase-messaging-sw.js` is in the `public` directory

### Permission denied

1. User must explicitly grant permission
2. Check browser notification settings
3. Some browsers require user interaction before requesting permission

## Best Practices

1. **Request permission at the right time**: Don't request immediately on page load. Wait for user engagement.
2. **Handle permission states**: Always check permission status before requesting.
3. **Store tokens securely**: Send FCM tokens to your backend for storage.
4. **Handle token refresh**: Tokens can change, so listen for token updates.
5. **Test on multiple browsers**: Different browsers may behave differently.

## API Reference

See the individual component/hook/service files for detailed API documentation.
