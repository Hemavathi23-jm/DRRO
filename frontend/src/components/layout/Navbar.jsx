import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from '../common/NotificationBell';
import Icon from '../common/Icon';
import SmsGatewayModal from '../common/SmsGatewayModal';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);


  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const raw = query.trim();
    const q = raw.toLowerCase();
    if (!q) return;

    const disasterKeywords = [
      'disaster', 'earthquake', 'flood', 'cyclone', 'storm', 'quake', 'landslide',
      'mudslide', 'fire', 'wildfire', 'tsunami', 'tornado', 'hurricane', 'typhoon',
      'drought', 'avalanche', 'incident', 'hazard', 'calamity'
    ];

    const resourceKeywords = [
      'resource', 'stock', 'inventory', 'blanket', 'food', 'water', 'medicine',
      'medical', 'tent', 'shelter', 'kit', 'ration', 'supplies', 'supply', 'blood',
      'oxygen', 'iv', 'generator', 'fuel', 'warehouse', 'center'
    ];

    const teamKeywords = ['team', 'batch', 'personnel', 'workforce', 'volunteer', 'doctor', 'nurse', 'medic', 'officer'];
    const dispatchKeywords = ['dispatch', 'deliver', 'transit', 'truck', 'vehicle', 'convoy', 'pod', 'shipment'];
    const allocationKeywords = ['allocat', 'recommend', 'optimize', 'match'];
    const locationKeywords = ['location', 'place', 'camp', 'safe place', 'safe'];

    if (q.includes('critical')) {
      navigate('/requests?urgency=CRITICAL');
    } else if (disasterKeywords.some((k) => q.includes(k))) {
      navigate(`/disasters?q=${encodeURIComponent(raw)}`);
    } else if (resourceKeywords.some((k) => q.includes(k))) {
      navigate(`/resources/inventory?q=${encodeURIComponent(raw)}`);
    } else if (teamKeywords.some((k) => q.includes(k))) {
      navigate(`/teams?q=${encodeURIComponent(raw)}`);
    } else if (dispatchKeywords.some((k) => q.includes(k))) {
      navigate(`/dispatch?q=${encodeURIComponent(raw)}`);
    } else if (allocationKeywords.some((k) => q.includes(k))) {
      navigate('/allocation');
    } else if (locationKeywords.some((k) => q.includes(k))) {
      navigate('/locations');
    } else if (q.includes('report')) {
      navigate('/reports');
    } else if (q.includes('request')) {
      navigate(`/requests?q=${encodeURIComponent(raw)}`);
    } else {
      // Default: Search across live disasters
      navigate(`/disasters?q=${encodeURIComponent(raw)}`);
    }
    setQuery('');
  };

  const initial = (user?.name || 'U').trim().charAt(0).toUpperCase();

  return (
    <>
      <div className="mobile-header">
        <button type="button" onClick={onMenuClick} aria-label="Open menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
        <span>DRRO</span>
      </div>

      <header className="topbar">
        <form className="topbar-search" onSubmit={handleSearch}>
          <svg className="topbar-search-icon topbar-search-icon--left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Search disasters, requests, resources…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search"
          />
        </form>

        <div className="topbar-actions">
          <button
            className="btn btn-danger btn-sm topbar-critical"
            type="button"
            onClick={() => navigate('/requests?urgency=CRITICAL')}
          >
            Critical
          </button>
          <button
            className="topbar-icon-btn"
            type="button"
            onClick={() => setIsSmsModalOpen(true)}
            title="SMS Alert Gateway & Ledger"
            aria-label="SMS Alert Gateway"
            style={{ position: 'relative' }}
          >
            <Icon name="phone" size={18} />
          </button>
          <button
            className="topbar-icon-btn"
            type="button"
            onClick={toggleTheme}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            <Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
          </button>
          <NotificationBell />
          <div className="topbar-user-chip">
            <span className="topbar-avatar" aria-hidden>{initial}</span>
            <div className="topbar-user-meta">
              <span className="topbar-user-name">{user?.name || 'User'}</span>
              <span className="topbar-user-role">{user?.role?.replace(/_/g, ' ') || ''}</span>
            </div>
          </div>
          <button
            className="topbar-icon-btn topbar-logout"
            type="button"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
      </header>

      <SmsGatewayModal
        isOpen={isSmsModalOpen}
        onClose={() => setIsSmsModalOpen(false)}
      />
    </>
  );
}

