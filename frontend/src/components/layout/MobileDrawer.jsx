import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { PRIMARY, RESOURCES, ADMIN } from './TopNav';
import Icon from '../common/Icon';

export default function MobileDrawer({ open, onClose }) {
  const { user, logout, hasRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const adminItems = ADMIN.filter((n) => !n.roles || hasRole(...n.roles));

  if (!open) return null;

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <div className="drawer-backdrop open" onClick={onClose} aria-hidden />
      <aside className="drawer open" aria-label="Navigation menu">
        <div className="drawer-head">
          <div>
            <div className="drawer-brand">DRRO</div>
            <div className="drawer-sub">
              {user?.name}
              {user?.role ? ` · ${user.role.replace(/_/g, ' ')}` : ''}
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close menu">
            <Icon name="x" size={16} />
          </button>
        </div>

        <nav className="drawer-nav">
          <p className="drawer-label">Operations</p>
          {PRIMARY.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `drawer-link${isActive ? ' active' : ''}`}
              onClick={onClose}
            >
              {item.label}
            </NavLink>
          ))}

          <p className="drawer-label">Resources</p>
          {RESOURCES.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `drawer-link${isActive ? ' active' : ''}`}
              onClick={onClose}
            >
              {item.label}
            </NavLink>
          ))}

          {adminItems.length > 0 && (
            <>
              <p className="drawer-label">Admin</p>
              {adminItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `drawer-link${isActive ? ' active' : ''}`}
                  onClick={onClose}
                >
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="drawer-footer">
          <button
            type="button"
            className="btn btn-danger"
            style={{ width: '100%' }}
            onClick={() => {
              onClose();
              navigate('/requests?urgency=CRITICAL');
            }}
          >
            View critical requests
          </button>
          <div className="drawer-footer-row">
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={toggleTheme}>
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </button>
            <button type="button" className="btn btn-secondary" style={{ flex: 1, color: 'var(--danger)' }} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
