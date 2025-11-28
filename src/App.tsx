import { useEffect } from 'react';
import { useAppDispatch } from './store/hooks';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import NotificationManager from './components/notifications/notification-manager.component';
import './i18n';
import AppRoutes from './routes/app.routes';
import { fetchConfig } from './actions/config.actions';

function App() {
  const dispatch = useAppDispatch();

  // Fetch configuration
  useEffect(() => {
    dispatch(fetchConfig());
  }, [dispatch]);

  return (
    <>
      <AppRoutes />
      <NotificationManager autoRequest={true} requestDelay={2000} />

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
