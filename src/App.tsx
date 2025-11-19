import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import NotificationManager from './components/notifications/notification-manager.component';
import './i18n';
import AppRoutes from './routes/app.routes';

function App() {
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
