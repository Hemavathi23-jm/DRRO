import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function PageWrapper({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <div
        className={`sidebar-backdrop${menuOpen ? ' open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden
      />
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenSos={() => { setSosOpen(true); setMenuOpen(false); }}
      />
      <div className="main-area">
        <Navbar onMenuClick={() => setMenuOpen(true)} />
        <main className="page-content">{children}</main>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Mobile">
        <NavLink to="/dashboard" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 11l8-7 8 7v8a1 1 0 01-1 1h-5v-5H10v5H5a1 1 0 01-1-1v-8z" strokeLinejoin="round" /></svg>
          Home
        </NavLink>
        <NavLink to="/disasters" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l8 14H4L12 3z" /><path d="M12 10v4" strokeLinecap="round" /></svg>
          Alerts
        </NavLink>
        <button type="button" className="mobile-nav-sos" onClick={() => setSosOpen(true)} aria-label="SOS">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v2M12 19v2M5 12H3M21 12h-2" strokeLinecap="round" />
            <circle cx="12" cy="12" r="3.5" />
          </svg>
        </button>
        <NavLink to="/requests" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 6h11M8 12h11M8 18h8" strokeLinecap="round" /></svg>
          Requests
        </NavLink>
        <NavLink to="/allocation" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 2.5" strokeLinecap="round" /></svg>
          Advice
        </NavLink>
      </nav>

      {sosOpen && (
        <div className="modal-overlay" onClick={() => setSosOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: 420 }}>
            <h2 className="modal-title">Emergency Service</h2>
            <p className="modal-body">
              Your location would be directly shared with the helpline team once you release
              the button after a long press of 5 seconds.
            </p>
            <div className="sos-modal-body">
              <button
                type="button"
                className="sos-modal-orb"
                onClick={() => {
                  setSosOpen(false);
                  navigate('/requests?urgency=CRITICAL');
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="3.5" />
                </svg>
              </button>
              <p className="sos-hint">Long press to start SOS signal</p>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%' }}
                onClick={() => {
                  setSosOpen(false);
                  navigate('/requests?urgency=CRITICAL');
                }}
              >
                Enable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
