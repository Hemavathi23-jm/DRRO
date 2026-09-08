// src/pages/Admin/UserManagement.jsx
import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAsyncData } from '../../hooks/useAsyncData';
import { userApi } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';

const ROLES = ['ADMIN', 'OFFICER', 'RESOURCE_MANAGER', 'COORDINATOR', 'FIELD_OPERATOR', 'VIEWER'];

export default function UserManagement() {
  const { data, loading, error, refetch } = useAsyncData(() => userApi.list(), []);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'OFFICER' });
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const handleToggleStatus = async (user) => {
    setActionError('');
    setActionSuccess('');
    try {
      if (user.status === 'ACTIVE') {
        await userApi.deactivate(user.userId);
        setActionSuccess(`User ${user.email} deactivated successfully.`);
      } else {
        await userApi.activate(user.userId);
        setActionSuccess(`User ${user.email} activated successfully.`);
      }
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to update user status.');
    }
  };

  const handleRoleChange = async (user, newRole) => {
    if (newRole === user.role) return;
    setActionError('');
    setActionSuccess('');
    try {
      await userApi.updateRole(user.userId, newRole);
      setActionSuccess(`Role updated to ${newRole} for ${user.email}.`);
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to update user role.');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    setSubmitting(true);
    try {
      await userApi.create(form);
      setActionSuccess(`User ${form.email} created successfully.`);
      setForm({ name: '', email: '', password: '', role: 'OFFICER' });
      setShowModal(false);
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageWrapper><LoadingSpinner message="Loading users…" /></PageWrapper>;
  if (error) return (
    <PageWrapper>
      <div className="empty-state">
        <p>Unable to load users. {error}</p>
        <button className="btn btn-primary mt-2" onClick={refetch}>Try again</button>
      </div>
    </PageWrapper>
  );

  const users = (data || []).map(u => ({ ...u, id: u.userId }));

  const columns = [
    { label: '#', accessor: 'userId', render: r => <span style={{ color: 'var(--text-muted)' }}>{r.userId}</span> },
    { label: 'Name', accessor: 'name', render: r => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { label: 'Email', accessor: 'email' },
    {
      label: 'Role',
      accessor: 'role',
      render: r => (
        <select
          className="form-select"
          style={{ padding: '2px 8px', fontSize: '0.78rem', width: 'auto', display: 'inline-block' }}
          value={r.role}
          onChange={e => handleRoleChange(r, e.target.value)}
        >
          {ROLES.map(role => (
            <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>
          ))}
        </select>
      )
    },
    { label: 'Status', accessor: 'status', render: r => <StatusBadge status={r.status} /> },
    { label: 'Joined', accessor: 'createdAt', render: r => formatDateTime(r.createdAt) },
    {
      label: 'Actions',
      accessor: 'userId',
      render: r => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-secondary btn-sm"
            style={{ color: r.status === 'ACTIVE' ? 'var(--danger)' : 'var(--success)' }}
            onClick={() => handleToggleStatus(r)}
          >
            {r.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      )
    },
  ];

  return (
    <PageWrapper>
      <div className="flex-between page-header">
        <div>
          <h2 className="page-title">User Management</h2>
          <p className="page-sub">{users.length} registered users · Role assignments & security</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add User</button>
      </div>

      {actionSuccess && (
        <div style={{ padding: '10px 14px', marginBottom: 16, backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid var(--success)', borderRadius: 6, color: 'var(--success)', fontSize: '0.875rem' }}>
          {actionSuccess}
        </div>
      )}

      {actionError && (
        <div style={{ padding: '10px 14px', marginBottom: 16, backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--danger)', borderRadius: 6, color: 'var(--danger)', fontSize: '0.875rem' }}>
          {actionError}
        </div>
      )}

      {showModal && (
        <div className="card" style={{ maxWidth: 520, marginBottom: 16 }}>
          <p className="card-title" style={{ marginBottom: 12 }}>Create New User</p>
          <form onSubmit={handleAddUser}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rahul Sharma" />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="e.g. rahul@drro.in" />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input className="form-input" type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Minimum 6 characters" minLength={6} />
              </div>
              <div className="form-group">
                <label className="form-label">Assigned Role *</label>
                <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create User'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <DataTable columns={columns} data={users} emptyMessage="No users found." />
      </div>
    </PageWrapper>
  );
}
