import { NavLink, useNavigate } from 'react-router-dom';
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
  reports: (
    <svg className="nav-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 19V5M4 19h16M8 15v-4M12 15V8M16 15v-6" strokeLinecap="round" />
    </svg>
  ),
  weights: (
    <svg className="nav-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 20V10M10 20V4M16 20v-7M20 20H2" strokeLinecap="round" />
    </svg>
  ),
  audit: (
    <svg className="nav-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" />
    </svg>
  ),
  users: (
    <svg className="nav-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
};

const OPERATIONS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/disasters', label: 'Disasters', icon: 'disasters' },
  { to: '/locations', label: 'Locations', icon: 'locations' },
  { to: '/requests', label: 'Requests', icon: 'requests' },
  { to: '/allocation', label: 'Allocation', icon: 'allocation' },
  { to: '/teams', label: 'Teams', icon: 'teams' },
  { to: '/dispatch', label: 'Dispatch', icon: 'dispatch' },
];

const RESOURCES = [
  { to: '/resources/inventory', label: 'Inventory', icon: 'resources' },
  { to: '/resources/types', label: 'Resource Types', icon: 'resources' },
  { to: '/resources/centers', label: 'Centers', icon: 'locations' },
];

const ADMIN = [
  { to: '/reports', label: 'Reports', icon: 'reports', roles: ['ADMIN', 'OFFICER', 'COORDINATOR', 'VIEWER'] },
  { to: '/admin/weights', label: 'Weights', icon: 'weights', roles: ['ADMIN', 'OFFICER'] },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: 'audit', roles: ['ADMIN'] },
  { to: '/admin/users', label: 'Users', icon: 'users', roles: ['ADMIN'] },
];

function NavItem({ item, onClose }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
      onClick={onClose}
    >
      {ICONS[item.icon]}
      <span className="nav-link-label">{item.label}</span>
      <Chevron />
    </NavLink>
  );
}

export default function Sidebar({ open = false, onClose }) {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const adminItems = ADMIN.filter((n) => !n.roles || hasRole(...n.roles));

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-logo" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3l8 14H4L12 3z" strokeLinejoin="round" />
            <path d="M12 10v4M12 17h.01" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div className="sidebar-brand-title">DRRO</div>
          <div className="sidebar-brand-sub">Command Center</div>
        </div>
      </div>

      <div className="sidebar-cta-wrap">
        <button
          type="button"
          className="sidebar-cta"
          onClick={() => {
            onClose?.();
            navigate('/allocation');
          }}
        >
          Run allocation
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Main">
        <div className="nav-group">
          <div className="nav-group-label">Operations</div>
          {OPERATIONS.map((n) => (
            <NavItem key={n.to} item={n} onClose={onClose} />
          ))}
        </div>

        <div className="nav-group">
          <div className="nav-group-label">Resources</div>
          {RESOURCES.map((n) => (
            <NavItem key={n.to} item={n} onClose={onClose} />
          ))}
        </div>

        {adminItems.length > 0 && (
          <div className="nav-group">
            <div className="nav-group-label">Admin</div>
            {adminItems.map((n) => (
              <NavItem key={n.to} item={n} onClose={onClose} />
            ))}
          </div>
        )}
      </nav>

      <div className="sidebar-foot">
        <div className="sidebar-foot-title">Critical queue</div>
        <p className="sidebar-foot-hint">Jump to high-urgency relief requests.</p>
        <button
          type="button"
          className="sidebar-foot-btn"
          onClick={() => {
            onClose?.();
            navigate('/requests?urgency=CRITICAL');
          }}
        >
          View critical →
        </button>
        <p className="sidebar-user-chip">Signed in as {user?.name}</p>
      </div>
    </aside>
  );
}
