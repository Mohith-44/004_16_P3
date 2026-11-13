import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { AppRoutes } from './routes/AppRoutes.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
