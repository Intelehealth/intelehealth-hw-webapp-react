import { IncomingCallProvider } from '@intelehealth/webrtc';
import '@intelehealth/webrtc/styles.css';
import { useEffect, useMemo } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { fetchConfig } from './actions/config.actions';
import './App.css';
import { GlobalModalProvider } from './components/modal/global-modal-context';
import './i18n';
import AppRoutes from './routes/app.routes';
import { useAppDispatch } from './store/hooks';
import { useStoredUser } from './hooks/useStoredUser';
import { fcmService } from './services/fcm.service';
import { showToast } from './services/toast';

function App() {
  const dispatch = useAppDispatch();
  const user = useStoredUser();

  // Fetch configuration
  useEffect(() => {
    dispatch(fetchConfig());
  }, [dispatch]);

  const callConfig = useMemo(
    () => ({
      socketUrl: import.meta.env.VITE_PORTAL_SOCKET_URL,
      liveKitUrl: import.meta.env.VITE_WEBRTC_SDK_SERVER_URL,
      user: user
        ? {
            uuid: user.person?.uuid ?? user.uuid,
            name:
              user.name ||
              user.person?.display ||
              user.username ||
              'Health Worker',
          }
        : null,
      onDecline: () => fcmService.closeCallNotifications(),
      onAccept: () => fcmService.closeCallNotifications(),
      onEnd: (
        _call: unknown,
        _socket: unknown,
        info?: { reason: string; message: string }
      ) => {
        fcmService.closeCallNotifications();
        if (info?.message) {
          showToast(
            'Call ended',
            info.message,
            info.reason === 'remote-left' ? 'info' : 'warning'
          );
        }
      },
    }),
    [user]
  );

  return (
    <>
      <IncomingCallProvider config={callConfig}>
        <GlobalModalProvider>
          <AppRoutes />
        </GlobalModalProvider>
      </IncomingCallProvider>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        //progressClassName="custom-progress-bar"
      />
    </>
  );
}

export default App;
