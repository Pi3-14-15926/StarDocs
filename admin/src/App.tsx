import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SetupPage } from './pages/SetupPage';
import { AdminPage } from './pages/AdminPage';
import { AIConfigPage } from './pages/AIConfigPage';
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

  useEffect(() => {
    initServices();
  }, [initServices]);

  return (
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
      <Route path="/admin/ai-config" element={<AIConfigPage />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
