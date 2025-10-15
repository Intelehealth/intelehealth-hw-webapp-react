import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import './i18n';
import AppRoutes from './routes/app.routes';

function App() {
  return (
    <>
      <AppRoutes />

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
