import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { isSetupComplete } from './utils/storage';
import Setup from './screens/Setup';
import ProfileSelect from './screens/ProfileSelect';
import Home from './screens/Home';
import Detail from './screens/Detail';
import ParentDashboard from './screens/ParentDashboard';

function ProtectedRoute({ children }) {
  if (!isSetupComplete()) {
    return <Navigate to="/setup" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/setup" element={<Setup />} />
          <Route
            path="/profiles"
            element={
              <ProtectedRoute>
                <ProfileSelect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/detail/:id"
            element={
              <ProtectedRoute>
                <Detail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent"
            element={
              <ProtectedRoute>
                <ParentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <Navigate to={isSetupComplete() ? '/profiles' : '/setup'} replace />
            }
          />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
