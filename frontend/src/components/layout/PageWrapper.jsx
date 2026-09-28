import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function PageWrapper({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="app-shell app-shell--sidebar">
      <div
        className={`sidebar-backdrop${menuOpen ? ' open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />

      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="main-area">
        <Navbar onMenuClick={() => setMenuOpen(true)} />
        <main className="page-content">{children}</main>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Mobile">
        <NavLink to="/dashboard" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M4 11l8-7 8 7v8a1 1 0 01-1 1h-5v-5H10v5H5a1 1 0 01-1-1v-8z" strokeLinejoin="round" />
          </svg>
          Home
        </NavLink>
        <NavLink to="/disasters" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M12 3l8 14H4L12 3z" />
            <path d="M12 10v4" strokeLinecap="round" />
          </svg>
          Disasters
        </NavLink>
        <button
          type="button"
          className="mobile-nav-sos"
          onClick={() => navigate('/requests?urgency=CRITICAL')}
          aria-label="Critical requests"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 3l8 14H4L12 3z" strokeLinejoin="round" />
            <path d="M12 10v4M12 17h.01" strokeLinecap="round" />
          </svg>
        </button>
        <NavLink to="/requests" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M8 6h11M8 12h11M8 18h8" strokeLinecap="round" />
          </svg>
          Requests
        </NavLink>
        <NavLink to="/allocation" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v4l2.5 2.5" strokeLinecap="round" />
          </svg>
          Allocation
        </NavLink>
      </nav>
    </div>
  );
}
