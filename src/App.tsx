import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { fetchConfig } from './actions/config.actions';
import './App.css';
import { GlobalModalProvider } from './components/modal/global-modal-context';
import './i18n';
import AppRoutes from './routes/app.routes';
import { useAppDispatch } from './store/hooks';

function App() {
  const dispatch = useAppDispatch();

  // Fetch configuration
  useEffect(() => {
    dispatch(fetchConfig());
  }, [dispatch]);

  return (
    <>
      <GlobalModalProvider>
        <AppRoutes />
      </GlobalModalProvider>
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
