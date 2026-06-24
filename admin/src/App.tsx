import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAlert } from './hooks/useAlert';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';
import { SetupPage } from './pages/SetupPage';
import { useConfigStore } from './stores/configStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { github } = useConfigStore();
  if (!github.token || !github.owner || !github.repo) {
    return <Navigate to="/admin/setup" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { initServices } = useConfigStore();
  const { AlertComponent } = useAlert();

  useEffect(() => {
    initServices();
  }, [initServices]);

  return (
    <>
      <Routes>
        <Route path="/admin/setup" element={<SetupPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ai-config"
          element={<Navigate to="/admin/settings" replace />}
        />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
      {AlertComponent}
    </>
  );
}
