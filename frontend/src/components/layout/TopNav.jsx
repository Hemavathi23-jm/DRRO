import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from '../common/NotificationBell';
import Icon from '../common/Icon';

const PRIMARY = [
  { to: '/dashboard', label: 'Home', end: true },
  { to: '/disasters', label: 'Disasters' },
  { to: '/requests', label: 'Requests' },
  { to: '/allocation', label: 'Allocation' },
  { to: '/dispatch', label: 'Dispatch' },
  { to: '/locations', label: 'Locations' },
  { to: '/teams', label: 'Teams' },
];

const RESOURCES = [
  { to: '/resources/inventory', label: 'Inventory' },
  { to: '/resources/types', label: 'Types' },
  { to: '/resources/centers', label: 'Centers' },
];

const ADMIN = [
  { to: '/reports', label: 'Reports', roles: ['ADMIN', 'OFFICER', 'COORDINATOR', 'RESOURCE_MANAGER', 'VIEWER'] },
  { to: '/admin/weights', label: 'Weights', roles: ['ADMIN', 'OFFICER'] },
  { to: '/admin/audit-logs', label: 'Audit logs', roles: ['ADMIN'] },
  { to: '/admin/users', label: 'Users', roles: ['ADMIN'] },
];

function Dropdown({ label, items, open, onToggle, onClose }) {
  const ref = useRef(null);
  const location = useLocation();
  const active = items.some(
    (i) => location.pathname === i.to || location.pathname.startsWith(`${i.to}/`),
  );

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onClose]);

  return (
    <div className={`tnav-dropdown${open ? ' open' : ''}${active ? ' is-active' : ''}`} ref={ref}>
      <button type="button" className="tnav-link tnav-dropdown-trigger" onClick={onToggle} aria-expanded={open}>
        {label}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="tnav-menu" role="menu">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              role="menuitem"
              className={({ isActive }) => `tnav-menu-item${isActive ? ' active' : ''}`}
              onClick={onClose}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TopNav({ onOpenMenu }) {
  const { user, logout, hasRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [openMenu, setOpenMenu] = useState(null);

  const adminItems = ADMIN.filter((n) => !n.roles || hasRole(...n.roles));

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    if (q.includes('critical')) navigate('/requests?urgency=CRITICAL');
    else if (q.includes('disaster')) navigate('/disasters');
    else if (q.includes('request')) navigate('/requests');
    else if (q.includes('resource') || q.includes('stock') || q.includes('inventory')) navigate('/resources/inventory');
    else if (q.includes('center')) navigate('/resources/centers');
    else if (q.includes('allocat')) navigate('/allocation');
    else if (q.includes('dispatch') || q.includes('deliver')) navigate('/dispatch');
    else if (q.includes('team')) navigate('/teams');
    else if (q.includes('location')) navigate('/locations');
    else if (q.includes('report')) navigate('/reports');
    else navigate(`/requests?q=${encodeURIComponent(query.trim())}`);
    setQuery('');
  };

  return (
    <header className="tnav">
      <div className="tnav-inner">
        <div className="tnav-left">
          <button type="button" className="tnav-burger" onClick={onOpenMenu} aria-label="Open menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>

          <NavLink to="/dashboard" className="tnav-brand" end>
            <span className="tnav-logo" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3l8 14H4L12 3z" strokeLinejoin="round" />
                <path d="M12 10v4M12 17h.01" strokeLinecap="round" />
              </svg>
            </span>
            <span className="tnav-brand-text">
              <strong>DRRO</strong>
              <small>Command</small>
            </span>
          </NavLink>
        </div>

        <nav className="tnav-links" aria-label="Primary">
          <div className="tnav-links-scroll">
            {PRIMARY.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `tnav-link${isActive ? ' active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="tnav-links-fixed">
            <Dropdown
              label="Resources"
              items={RESOURCES}
              open={openMenu === 'resources'}
              onToggle={() => setOpenMenu((m) => (m === 'resources' ? null : 'resources'))}
              onClose={() => setOpenMenu(null)}
            />
            {adminItems.length > 0 && (
              <Dropdown
                label="Admin"
                items={adminItems}
                open={openMenu === 'admin'}
                onToggle={() => setOpenMenu((m) => (m === 'admin' ? null : 'admin'))}
                onClose={() => setOpenMenu(null)}
              />
            )}
          </div>
        </nav>

        <form className="tnav-search" onSubmit={handleSearch}>
          <input
            type="search"
            placeholder="Jump to page or filter requests…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search"
          />
        </form>

        <div className="tnav-actions">
          <button
            type="button"
            className="btn btn-danger btn-sm tnav-critical"
            onClick={() => navigate('/requests?urgency=CRITICAL')}
          >
            Critical
          </button>
          <button
            className="btn-icon tnav-theme"
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            <span className="tnav-theme-label">{theme === 'light' ? 'Dark' : 'Light'}</span>
            <Icon name={theme === 'light' ? 'moon' : 'sun'} size={16} className="tnav-theme-icon" />
          </button>
          <NotificationBell />
          <span className="role-badge tnav-role">{user?.role?.replace(/_/g, ' ')}</span>
          <span className="tnav-user">{user?.name}</span>
          <button
            className="btn-icon tnav-logout"
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
            style={{ color: 'var(--danger)' }}
          >
            <span className="tnav-logout-label">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export { PRIMARY, RESOURCES, ADMIN };
