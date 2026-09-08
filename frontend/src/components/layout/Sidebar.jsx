import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Chevron = () => (
  <svg className="nav-link-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ICONS = {
  dashboard: (
    <svg className="nav-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  disasters: (
    <svg className="nav-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 3l8 14H4L12 3z" />
      <path d="M12 10v4M12 17h.01" strokeLinecap="round" />
    </svg>
  ),
  locations: (
    <svg className="nav-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 21s7-5.2 7-11a7 7 0 10-14 0c0 5.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  ),
  resources: (
    <svg className="nav-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 9l9-5 9 5-9 5-9-5z" />
      <path d="M3 14l9 5 9-5" />
    </svg>
  ),
  requests: (
    <svg className="nav-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M8 6h11M8 12h11M8 18h8" strokeLinecap="round" />
      <circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  allocation: (
    <svg className="nav-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 2.5" strokeLinecap="round" />
    </svg>
  ),
  teams: (
    <svg className="nav-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="9" cy="8" r="3" />
      <circle cx="16" cy="9" r="2.5" />
      <path d="M3.5 19c.8-3 2.8-4.5 5.5-4.5S14 16 14.8 19" strokeLinecap="round" />
    </svg>
  ),
  dispatch: (
    <svg className="nav-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 16h11V7H3v9zM14 11h4l3 3v2h-7v-5z" strokeLinejoin="round" />
      <circle cx="7" cy="17.5" r="1.5" />
      <circle cx="17" cy="17.5" r="1.5" />
    </svg>
  ),
  weights: (
    <svg className="nav-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 20V10M10 20V4M16 20v-7M20 20H2" strokeLinecap="round" />
    </svg>
  ),
};

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/disasters', label: 'Disasters', icon: 'disasters' },
  { to: '/locations', label: 'Locations', icon: 'locations' },
  { to: '/resources/inventory', label: 'Resources', icon: 'resources' },
  { to: '/requests', label: 'Requests', icon: 'requests' },
  { to: '/allocation', label: 'Allocation', icon: 'allocation' },
  { to: '/teams', label: 'Teams', icon: 'teams' },
  { to: '/dispatch', label: 'Dispatch', icon: 'dispatch' },
  { to: '/admin/weights', label: 'Weights', icon: 'weights' },
];

export default function Sidebar({ open = false, onClose, onOpenSos }) {
  const { user } = useAuth();

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-logo" aria-hidden>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21s-7-4.35-7-10a5 5 0 019.9-1.05A5 5 0 0119 11c0 5.65-7 10-7 10z" opacity="0.95" />
            <path d="M9.5 11.2V9.8h1.3V8.5h1.4v1.3h1.3v1.4h-1.3v1.3h-1.4v-1.3H9.5z" fill="#e85a3c" />
          </svg>
        </div>
        <div>
          <div className="sidebar-brand-title">Disaster</div>
          <div className="sidebar-brand-sub">Resource Optimizer</div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main">
        {NAV.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            onClick={onClose}
          >
            {ICONS[n.icon]}
            {n.label}
            <Chevron />
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-sos">
        <button type="button" className="sos-orb" onClick={onOpenSos} aria-label="Open SOS">
          <div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4" strokeLinecap="round" />
              <circle cx="12" cy="12" r="3.5" />
            </svg>
            <div className="sos-orb-label">SOS</div>
          </div>
        </button>
        <p className="sos-hint">Long press to start SOS signal</p>
        <button type="button" className="sos-enable" onClick={onOpenSos}>Enable</button>
        <p className="sos-hint" style={{ marginTop: 12, marginBottom: 0 }}>
          Signed in as {user?.name}
        </p>
      </div>
    </aside>
  );
}
