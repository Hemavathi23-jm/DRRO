import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';
import api from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'drro_token';
const USER_KEY  = 'drro_user';

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true until we check localStorage

  /* On mount: restore session from localStorage */
  useEffect(() => {
    const token    = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);
    if (token && userJson) {
      try {
        const parsed = JSON.parse(userJson);
        setUser(parsed);
        // Attach token to every future request
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    // Backend returns: { token, userId, email, name, role }
    const { token, userId, email: userEmail, name, role } = data;

    const userObj = { id: userId, email: userEmail, name, role };

    // Persist to localStorage
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userObj));

    // Set default auth header for all future requests
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    setUser(userObj);
    return userObj;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  const hasRole = useCallback((...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
