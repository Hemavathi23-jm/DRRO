import { useState, useEffect } from 'react';
import { smsApi } from '../../services/api';
import Icon from './Icon';

export default function SmsGatewayModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('send'); // 'send' | 'logs'
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [config, setConfig] = useState(null);
  const [notice, setNotice] = useState(null);

  // Form State
  const [recipientRole, setRecipientRole] = useState('ADMIN');
  const [phone, setPhone] = useState('+15550199');
  const [recipientName, setRecipientName] = useState('System Admin');
  const [eventType, setEventType] = useState('ADMIN_CRITICAL_ALERT');
  const [message, setMessage] = useState(
    '🛡️ [DRRO ADMIN ALERT] High-severity disaster logged: Severe Cyclone Alert. Multi-agency response recommended.'
  );

  const maskPhone = (num) => {
    if (!num) return '••••••';
    const clean = String(num).trim();
    if (clean.length < 6) return '••••••';
    const last4 = clean.slice(-4);
    const prefix = clean.startsWith('+') ? clean.slice(0, 3) : clean.slice(0, 2);
    return `${prefix} ••••• •${last4}`;
  };


  const PRESET_TEMPLATES = [
    {
      role: 'ADMIN',
      name: 'System Admin',
      event: 'ADMIN_CRITICAL_ALERT',
      title: '🚨 Admin: Critical Disaster Alert',
      phone: '+15550199',
      text: '🛡️ [DRRO ADMIN ALERT] High-severity disaster logged: Flash Flood Level 4 at Sector 7. Multi-agency response recommended.',
    },
    {
      role: 'ADMIN',
      name: 'System Admin',
      event: 'ADMIN_DEFICIT_WARNING',
      title: '⚠️ Admin: Unmet Demand Alert',
      phone: '+15550199',
      text: '⚠️ [DRRO ADMIN DEFICIT] Relief deficit at Sector 4: 150 units unmet. 2 allocations awaiting immediate admin approval.',
    },
    {
      role: 'TEAM_LEAD',
      name: 'Dr. Marcus Vance (Batch Alpha Lead)',
      event: 'DISPATCH',
      title: '🚚 Dispatch: Team Lead Deployment',
      phone: '+15550211',
      text: '🚚 [DRRO DISPATCH] Batch Alpha (8 personnel) dispatched to Metro Shelter. Transport: Truck-04. ETA: 2.0 hrs.',
    },
    {
      role: 'FIELD_OFFICER',
      name: 'Sarah Jenkins (Field Lead)',
      event: 'DELIVERY_POD',
      title: '✅ Delivery: Confirmation & POD',
      phone: '+15550222',
      text: '✅ [DRRO DELIVERED] Request #104 at South Camp completed. Delivered: 100 Blankets. Status: FULFILLED.',
    },
    {
      role: 'WAREHOUSE_MGR',
      name: 'Dave Miller (Hub Alpha)',
      event: 'STOCK_WARNING',
      title: '⚠️ Inventory: Low Stock Warning',
      phone: '+15550233',
      text: '⚠️ [DRRO STOCK ALERT] Low stock warning for Medical Kits (15 remaining at Central Hub). Restock requested.',
    },
    {
      role: 'TESTER',
      name: 'Developer / Tester',
      event: 'TEST',
      title: '📱 Test: Twilio Gateway Handshake',
      phone: '+15550199',
      text: '🛡️ [DRRO TEST] Twilio Free SMS gateway connection handshake verified successfully.',
    },
  ];

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await smsApi.getLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load SMS logs', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const data = await smsApi.getConfig();
      setConfig(data);
      if (data?.adminPhone) setPhone(data.adminPhone);
    } catch (err) {
      console.error('Failed to load SMS config', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
      fetchLogs();
    }
  }, [isOpen]);

  const handleSelectTemplate = (tpl) => {
    setRecipientRole(tpl.role);
    setRecipientName(tpl.name);
    setPhone(tpl.phone);
    setEventType(tpl.event);
    setMessage(tpl.text);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!phone || !message) return;
    try {
      setSending(true);
      setNotice(null);
      const res = await smsApi.send({
        recipientPhone: phone,
        recipientName,
        recipientRole,
        eventType,
        message,
      });
      setNotice({
        type: 'success',
        text: `SMS dispatched successfully! Status: ${res?.status || 'PROCESSED'}`,
      });
      fetchLogs();
    } catch (err) {
      setNotice({
        type: 'error',
        text: `SMS dispatch failed: ${err?.response?.data?.message || err.message}`,
      });
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 840, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="phone" size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>DRRO SMS Alert & Gateway Manager</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Automated SMS alerts for Admins, Response Teams, Field Leads & Deliveries
              </p>
            </div>
          </div>
          <button className="btn btn-icon btn-sm" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Status Bar */}
        <div
          style={{
            margin: '1rem 0',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: config?.isLiveConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            border: `1px solid ${config?.isLiveConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: config?.isLiveConnected ? '#10b981' : '#3b82f6',
                boxShadow: `0 0 8px ${config?.isLiveConnected ? '#10b981' : '#3b82f6'}`,
              }}
            />
            <span>
              <strong>Active Gateway:</strong> {config?.gatewayMode || 'Twilio Sandbox & Local Audit Engine'}
            </span>
          </div>
          <div style={{ color: 'var(--text-muted)' }}>
            Admin Phone: <code style={{ color: 'var(--text-color)', letterSpacing: '0.05em' }}>{maskPhone(config?.adminPhone || '+15550199')}</code>
          </div>
        </div>


        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
          <button
            className={`btn btn-sm ${activeTab === 'send' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('send')}
            style={{ borderRadius: '6px 6px 0 0' }}
          >
            ⚡ Dispatch / Test SMS
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'logs' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => {
              setActiveTab('logs');
              fetchLogs();
            }}
            style={{ borderRadius: '6px 6px 0 0' }}
          >
            📋 SMS Outbox & Audit Trail ({logs.length})
          </button>
        </div>

        {/* Tab 1: Dispatch & Test Form */}
        {activeTab === 'send' && (
          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
            {notice && (
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: 6,
                  marginBottom: '1rem',
                  background: notice.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: notice.type === 'success' ? '#10b981' : '#ef4444',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}
              >
                {notice.text}
              </div>
            )}

            {/* Quick Presets */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                SELECT SMS EVENT TEMPLATE:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem' }}>
                {PRESET_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    style={{
                      textAlign: 'left',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '6px',
                      border: eventType === tpl.event && recipientRole === tpl.role ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                      background: eventType === tpl.event && recipientRole === tpl.role ? 'rgba(59, 130, 246, 0.1)' : 'var(--card-bg)',
                      color: 'var(--text-color)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{tpl.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{tpl.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input Form */}
            <form onSubmit={handleSend}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>
                    Recipient Role
                  </label>
                  <select
                    className="form-control"
                    value={recipientRole}
                    onChange={(e) => setRecipientRole(e.target.value)}
                  >
                    <option value="ADMIN">🛡️ Admin</option>
                    <option value="TEAM_LEAD">🚚 Batch Team Lead</option>
                    <option value="FIELD_OFFICER">🚨 Field Officer</option>
                    <option value="WAREHOUSE_MGR">📦 Warehouse Mgr</option>
                    <option value="TESTER">📱 Tester</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1234567890"
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>
                  SMS Message Body ({message.length} chars)
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter message text..."
                  required
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? 'Sending...' : '⚡ Send SMS Alert'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Outbox / Audit Ledger */}
        {activeTab === 'logs' && (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Recent SMS dispatches recorded by DRRO Gateway
              </span>
              <button className="btn btn-ghost btn-sm" onClick={fetchLogs} disabled={loading}>
                <Icon name="refresh-cw" size={14} /> Refresh
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading SMS logs...</div>
            ) : logs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No SMS alerts sent yet. Try sending one from the Dispatch tab!
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table" style={{ fontSize: '0.82rem' }}>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Recipient</th>
                      <th>Role</th>
                      <th>Event</th>
                      <th>Message</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l.smsId}>
                        <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                          {l.sentAt ? new Date(l.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Now'}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <strong>{l.recipientName || 'Officer'}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {maskPhone(l.recipientPhone)}
                          </div>
                        </td>

                        <td>
                          <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                            {l.recipientRole || 'USER'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.eventType}</span>
                        </td>
                        <td style={{ maxWidth: 280, wordBreak: 'break-word', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                          {l.message}
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              background:
                                l.status === 'SENT' || l.status === 'DELIVERED'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : l.status === 'SIMULATED'
                                  ? 'rgba(59, 130, 246, 0.15)'
                                  : 'rgba(239, 68, 68, 0.15)',
                              color:
                                l.status === 'SENT' || l.status === 'DELIVERED'
                                  ? '#10b981'
                                  : l.status === 'SIMULATED'
                                  ? '#3b82f6'
                                  : '#ef4444',
                            }}
                          >
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
