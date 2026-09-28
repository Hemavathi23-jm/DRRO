import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Wraps any route that requires authentication.
 * Redirects unauthenticated users to /login, preserving the intended destination.
 */
export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="empty-state" style={{ margin: 48, boxShadow: 'none' }} aria-busy="true">
        <div className="spinner" />
        <p>Restoring session…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
