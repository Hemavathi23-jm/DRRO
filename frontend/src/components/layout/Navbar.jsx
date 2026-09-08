import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from '../common/NotificationBell';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    if (q.includes('disaster')) navigate('/disasters');
    else if (q.includes('request')) navigate('/requests');
    else if (q.includes('resource') || q.includes('stock')) navigate('/resources/inventory');
    else if (q.includes('allocat')) navigate('/allocation');
    else if (q.includes('dispatch') || q.includes('deliver')) navigate('/dispatch');
    else if (q.includes('team')) navigate('/teams');
    else if (q.includes('location')) navigate('/locations');
    else navigate('/disasters');
  };

  return (
    <>
      <div className="mobile-header">
        <button type="button" onClick={onMenuClick} aria-label="Open menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
        <span>Disaster Management</span>
      </div>

      <header className="topbar">
        <form className="topbar-search" onSubmit={handleSearch}>
          <input
            type="search"
            placeholder="Search disasters, requests, resources…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search"
          />
          <svg className="topbar-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
        </form>
        <div className="topbar-actions">
          <button className="btn-icon" type="button" onClick={toggleTheme} title="Toggle theme">
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
          <NotificationBell />
          <span className="role-badge">{user?.role?.replace(/_/g, ' ')}</span>
          <span className="topbar-user">{user?.name}</span>
          <button className="btn-icon" type="button" onClick={handleLogout} title="Logout" style={{ color: 'var(--danger)', fontWeight: 600 }}>
            ⏻ Logout
          </button>
        </div>
      </header>
    </>
  );
}
