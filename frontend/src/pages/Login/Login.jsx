import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const DEMO_ACCOUNTS = [
  { email: 'admin@drro.com',   password: 'Admin@123', role: 'Admin',            color: '#e85a3c' },
  { email: 'officer@drro.com', password: 'Admin@123', role: 'Officer',          color: '#2563eb' },
  { email: 'manager@drro.com', password: 'Admin@123', role: 'Resource Manager', color: '#16a34a' },
  { email: 'field@drro.com',   password: 'Admin@123', role: 'Field Operator',   color: '#d97706' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/dashboard';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  return (
    <div className="login-root">
      {/* ── Left hero panel ── */}
      <aside className="login-hero">
        <div className="login-hero-inner">
          <div className="login-logo-wrap">
            <span className="login-logo-icon">🛡️</span>
            <span className="login-logo-text">DRRO</span>
          </div>
          <h1 className="login-hero-title">
            Coordinated Relief.<br />
            <span className="login-hero-accent">When It Matters Most.</span>
          </h1>
          <p className="login-hero-desc">
            Prioritize relief requests, allocate scarce resources, and coordinate
            field operations from a single command centre.
          </p>

          <div className="login-stats">
            <div className="login-stat">
              <span className="login-stat-num">17</span>
              <span className="login-stat-label">Active Modules</span>
            </div>
            <div className="login-stat">
              <span className="login-stat-num">Live</span>
              <span className="login-stat-label">GDACS + USGS Feed</span>
            </div>
            <div className="login-stat">
              <span className="login-stat-num">4</span>
              <span className="login-stat-label">Role-Based Views</span>
            </div>
          </div>

          <div className="login-hero-badges">
            <span className="login-badge">🌐 Real-time Data</span>
            <span className="login-badge">🔒 JWT Secured</span>
            <span className="login-badge">📊 Smart Allocation</span>
          </div>
        </div>

        <p className="login-hero-foot">Disaster Resource Response Optimizer · v1.0</p>
      </aside>

      {/* ── Right login panel ── */}
      <main className="login-panel">
        <div className="login-card">
          <div className="login-card-header">
            <h2 className="login-card-title">Welcome back</h2>
            <p className="login-card-sub">Sign in to your workspace</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="lf-group">
              <label className="lf-label" htmlFor="login-email">Email address</label>
              <div className="lf-input-wrap">
                <span className="lf-icon">✉️</span>
                <input
                  id="login-email"
                  className="lf-input"
                  type="email"
                  placeholder="admin@drro.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="lf-group">
              <label className="lf-label" htmlFor="login-password">Password</label>
              <div className="lf-input-wrap">
                <span className="lf-icon">🔑</span>
                <input
                  id="login-password"
                  className="lf-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="lf-toggle-pass"
                  onClick={() => setShowPass(v => !v)}
                  aria-label="Toggle password visibility"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="lf-error" role="alert">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              id="login-submit"
              className="lf-btn-primary"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="lf-spinner" />
              ) : (
                <>Sign in <span className="lf-arrow">→</span></>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="login-demo-section">
            <p className="login-demo-title">Quick demo access</p>
            <div className="login-demo-grid">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  className="login-demo-btn"
                  onClick={() => fillDemo(acc)}
                  style={{ '--demo-color': acc.color }}
                >
                  <span className="demo-role">{acc.role}</span>
                  <span className="demo-email">{acc.email}</span>
                </button>
              ))}
            </div>
            <p className="login-demo-hint">Click a role to auto-fill credentials · Password: <strong>Admin@123</strong></p>
          </div>
        </div>
      </main>
    </div>
  );
}
