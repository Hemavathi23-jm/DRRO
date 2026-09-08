import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Wraps any route that requires authentication.
 * Redirects unauthenticated users to /login, preserving the intended destination.
 */
export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Still checking localStorage — render nothing to avoid flicker
  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
