import { useMemo, useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import FilterBar from '../../components/common/FilterBar';
import Icon from '../../components/common/Icon';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { teamApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const FILTER_DEFAULTS = { availability: 'ALL', q: '' };
const AVAIL_OPTS = ['ALL', 'AVAILABLE', 'DEPLOYED', 'OFF_DUTY'];

// 5 Structured Default Response Batches (6-8 personnel each)
const DEFAULT_BATCHES = [
  {
    batchCode: 'BATCH-1',
    name: 'Alpha Response Unit',
    memberCount: 8,
    lead: 'Dr. Marcus Vance',
    role: 'Emergency Medical & Triage',
    skills: 'Trauma Care, Mobile Surgery, ICU Support, Paramedic Response',
    contact: '+91 98765 43210',
    availability: 'AVAILABLE',
    members: ['Dr. Marcus Vance (Lead)', 'Dr. Priya Sharma (Surgeon)', 'N. Rajesh (Paramedic)', 'A. Scott (EMT)', 'L. Zhang (Nurse)', 'K. Patel (Triage)', 'R. Kumar (Driver)', 'M. Ali (Orderly)'],
  },
  {
    batchCode: 'BATCH-2',
    name: 'Bravo Rescue Unit',
    memberCount: 7,
    lead: 'Sarah Jenkins',
    role: 'Search & Structural Rescue',
    skills: 'Collapsed Structure Search, Drone Recon, Canine Handling, Extraction',
    contact: '+91 98765 43211',
    availability: 'DEPLOYED',
    mission: 'Flooding Sector 4 - Emergency Evacuation',
    members: ['Sarah Jenkins (Lead)', 'Vikram Seth (Canine Handler)', 'Carlos Mendez (Rope Tech)', 'Ananya Roy (Drone Ops)', 'Dave Wilson (Extraction)', 'Sunita Devi (Medic)', 'Kenji Sato (Spotter)'],
  },
  {
    batchCode: 'BATCH-3',
    name: 'Charlie Relief Unit',
    memberCount: 8,
    lead: 'David Kumar',
    role: 'Water, Sanitation & Shelter (WASH)',
    skills: 'Water Purification, Field Shelter Setup, Biohazard Control, Disease Prevention',
    contact: '+91 98765 43212',
    availability: 'AVAILABLE',
    members: ['David Kumar (Lead)', 'Anita Desai (WASH Eng)', 'G. Thomas (Purification)', 'S. Nair (Sanitation)', 'Paul Walker (Logistics)', 'F. Khan (Plumbing)', 'H. Chen (Field Tech)', 'R. Singh (Operator)'],
  },
  {
    batchCode: 'BATCH-4',
    name: 'Delta Logistics Unit',
    memberCount: 6,
    lead: 'Elena Rostova',
    role: 'Supply Chain & Heavy Transport',
    skills: 'Food Distribution, Heavy Vehicle Fleet, Warehouse Management, Cold Chain',
    contact: '+91 98765 43213',
    availability: 'DEPLOYED',
    mission: 'Disaster Relief Hub Alpha - Food Aid Convoy',
    members: ['Elena Rostova (Lead)', 'Arjun Mehra (Fleet Lead)', 'T. Brown (Supply Officer)', 'Samir Sen (Dispatcher)', 'O. Vance (Forklift Ops)', 'J. Taylor (Mechanic)'],
  },
  {
    batchCode: 'BATCH-5',
    name: 'Echo Engineering Unit',
    memberCount: 7,
    lead: 'Tariq Al-Mansoor',
    role: 'Telecom, Power & Clearing',
    skills: 'Satellite Comm, Solar Microgrid, Road Clearing, Generator Maintenance',
    contact: '+91 98765 43214',
    availability: 'AVAILABLE',
    members: ['Tariq Al-Mansoor (Lead)', 'Neha Gupta (Telecom Eng)', 'Brian Clark (Electrician)', 'V. Reddy (Heavy Machine)', 'A. Gomez (Power Tech)', 'C. Zhang (Radio Ops)', 'K. Lee (Lineman)'],
  },
];

export default function TeamList() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const { values, setValue, clearAll } = useUrlFilters(FILTER_DEFAULTS);
  const [viewMode, setViewMode] = useState('BATCHES'); // 'BATCHES' | 'TABLE'
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [batches, setBatches] = useState(DEFAULT_BATCHES);

  const [form, setForm] = useState({
    name: '',
    skills: '',
    contact: '',
    memberCount: 7,
    latitude: '',
    longitude: '',
    availability: 'AVAILABLE',
  });

  const { data, loading, error, refetch } = useAsyncData(() => teamApi.list(), []);

  // Compute live human power figures
  const totalHumanPower = useMemo(() => {
    return batches.reduce((acc, b) => acc + (b.memberCount || 7), 0);
  }, [batches]);

  const availableHumanPower = useMemo(() => {
    return batches
      .filter((b) => b.availability === 'AVAILABLE')
      .reduce((acc, b) => acc + (b.memberCount || 7), 0);
  }, [batches]);

  const deployedHumanPower = useMemo(() => {
    return batches
      .filter((b) => b.availability === 'DEPLOYED')
      .reduce((acc, b) => acc + (b.memberCount || 7), 0);
  }, [batches]);

  const handleToggleStatus = (batchCode) => {
    setBatches((prev) =>
      prev.map((b) => {
        if (b.batchCode === batchCode) {
          const nextStatus = b.availability === 'AVAILABLE' ? 'DEPLOYED' : 'AVAILABLE';
          toast.success(`${b.name} marked as ${nextStatus}. Human power updated.`);
          return {
            ...b,
            availability: nextStatus,
            mission: nextStatus === 'DEPLOYED' ? 'Rapid Response Deployment' : null,
          };
        }
        return b;
      })
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      await teamApi.create({
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      });

      // Add to local batches
      const newBatch = {
        batchCode: `BATCH-${batches.length + 1}`,
        name: form.name,
        memberCount: Number(form.memberCount) || 7,
        lead: 'Field Supervisor',
        role: form.skills,
        skills: form.skills,
        contact: form.contact,
        availability: form.availability,
        members: [`Leader (${form.contact})`, ...Array.from({ length: (Number(form.memberCount) || 7) - 1 }, (_, i) => `Team Specialist #${i + 1}`)],
      };

      setBatches((prev) => [...prev, newBatch]);
      setForm({ name: '', skills: '', contact: '', memberCount: 7, latitude: '', longitude: '', availability: 'AVAILABLE' });
      setShow(false);
      toast.success('Response team registered successfully.');
      refetch();
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to create team.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBatches = useMemo(() => {
    let list = batches;
    if (values.availability !== 'ALL') {
      list = list.filter((b) => b.availability === values.availability);
    }
    const q = (values.q || '').trim().toLowerCase();
    if (q) {
      list = list.filter((b) =>
        [b.name, b.batchCode, b.lead, b.role, b.skills, b.contact, b.mission]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }
    return list;
  }, [batches, values]);

  const tableColumns = [
    { label: 'Batch', accessor: 'batchCode', render: (r) => <strong style={{ color: 'var(--primary)' }}>{r.batchCode}</strong> },
    { label: 'Team Name', accessor: 'name', render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    {
      label: 'Human Power',
      accessor: 'memberCount',
      render: (r) => (
        <span className="badge badge-active" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
          👥 {r.memberCount} Personnel
        </span>
      ),
    },
    { label: 'Role / Specialization', accessor: 'role', render: (r) => <span style={{ fontSize: '0.82rem' }}>{r.role}</span> },
    { label: 'Team Lead', accessor: 'lead' },
    { label: 'Status', accessor: 'availability', render: (r) => <StatusBadge status={r.availability} /> },
    {
      label: 'Action',
      accessor: 'actions',
      render: (r) => (
        <button
          type="button"
          className={`btn btn-sm ${r.availability === 'AVAILABLE' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
          onClick={() => handleToggleStatus(r.batchCode)}
        >
          {r.availability === 'AVAILABLE' ? '🚀 Dispatch' : '↩ Standby'}
        </button>
      ),
    },
  ];

  if (loading) return <PageWrapper><LoadingSpinner message="Loading response teams…" /></PageWrapper>;
  if (error) {
    return (
      <PageWrapper>
        <EmptyState
          title="Unable to load teams"
          description={String(error)}
          action={<button className="btn btn-primary" type="button" onClick={refetch}>Try again</button>}
        />
      </PageWrapper>
    );
  }

  const availableBatchesCount = batches.filter((b) => b.availability === 'AVAILABLE').length;

  return (
    <PageWrapper>
      <PageHeader
        title="Human Power & Response Teams"
        subtitle={`5 Structured Batches (6-8 Personnel Each) · ${totalHumanPower} Total Workforce`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'BATCHES' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 0, padding: '6px 12px' }}
                onClick={() => setViewMode('BATCHES')}
              >
                🗂️ Batches View
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'TABLE' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 0, padding: '6px 12px' }}
                onClick={() => setViewMode('TABLE')}
              >
                📋 Table View
              </button>
            </div>
            {hasRole('COORDINATOR', 'ADMIN') && (
              <button className="btn btn-primary" type="button" onClick={() => setShow((s) => !s)}>
                + Add Batch Team
              </button>
            )}
          </div>
        }
      />

      {/* Human Power Live Tracker Header Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div className="card" style={{ padding: '14px 18px', background: 'var(--bg-card)', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL HUMAN WORKFORCE</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
            👥 {totalHumanPower} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Personnel</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>5 Active Deployment Batches</div>
        </div>

        <div className="card" style={{ padding: '14px 18px', background: 'rgba(16, 185, 129, 0.08)', borderLeft: '4px solid var(--success)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 700 }}>AVAILABLE ON STANDBY</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)', marginTop: 2 }}>
            🟢 {availableHumanPower} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Personnel</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{availableBatchesCount} Batches Ready for Immediate Deployment</div>
        </div>

        <div className="card" style={{ padding: '14px 18px', background: 'rgba(59, 130, 246, 0.08)', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700 }}>CURRENTLY DISPATCHED</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>
            🚀 {deployedHumanPower} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Personnel</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{batches.length - availableBatchesCount} Batches Active in Field Operations</div>
        </div>

        <div className="card" style={{ padding: '14px 18px', background: 'rgba(245, 158, 11, 0.08)', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--warning)', fontWeight: 700 }}>DEPLOYMENT READINESS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--warning)', marginTop: 2 }}>
            {Math.round((availableHumanPower / (totalHumanPower || 1)) * 100)}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Workforce Reserve Capacity</div>
        </div>
      </div>

      <FilterBar
        values={values}
        onChange={setValue}
        onClear={clearAll}
        resultCount={filteredBatches.length}
        filters={[
          { key: 'availability', label: 'Status', type: 'chips', options: AVAIL_OPTS },
          { key: 'q', label: 'Search', type: 'search', placeholder: 'Search batch, lead, skills, contact…' },
        ]}
      />

      {show && (
        <div className="card" style={{ maxWidth: 580, marginBottom: 16, border: '1px solid var(--primary)' }}>
          <p className="card-title" style={{ marginBottom: 12 }}>Register Response Team Batch</p>
          {submitError && <p className="form-error" style={{ marginBottom: 12 }}>{submitError}</p>}
          <form onSubmit={handleCreate}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Team / Batch Name *</label>
                <input className="form-input" required placeholder="e.g. Foxtrot Relief Unit" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Personnel Count (6-8 People) *</label>
                <input
                  className="form-input"
                  type="number"
                  min="6"
                  max="12"
                  required
                  value={form.memberCount}
                  onChange={(e) => setForm((f) => ({ ...f, memberCount: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Contact Phone *</label>
                <input className="form-input" required placeholder="+91 98765 43215" value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Initial Status</label>
                <select className="form-select" value={form.availability} onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value }))}>
                  <option value="AVAILABLE">AVAILABLE (Standby)</option>
                  <option value="DEPLOYED">DEPLOYED (Active Field)</option>
                  <option value="OFF_DUTY">OFF_DUTY (Resting)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Core Skills & Specialization *</label>
              <input className="form-input" required placeholder="e.g. Search & Rescue, Medical, Logistics" value={form.skills} onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Registering…' : 'Register Batch'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setShow(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {viewMode === 'BATCHES' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {filteredBatches.map((batch) => {
            const isAvail = batch.availability === 'AVAILABLE';
            return (
              <div
                key={batch.batchCode}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isAvail ? '1px solid var(--border)' : '1px solid rgba(59, 130, 246, 0.4)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.06)',
                  padding: 16,
                  position: 'relative',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: 0.5 }}>
                        {batch.batchCode}
                      </span>
                      <h3 style={{ margin: '2px 0 0', fontSize: '1.1rem', fontWeight: 700 }}>
                        {batch.name}
                      </h3>
                    </div>
                    <StatusBadge status={batch.availability} />
                  </div>

                  {/* Human Power Badge */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface)', padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                    👥 {batch.memberCount} Personnel In Batch
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                    <strong>Specialization:</strong> {batch.role}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                    <strong>Lead:</strong> {batch.lead} · 📞 {batch.contact}
                  </div>

                  {batch.mission && (
                    <div style={{ padding: '6px 10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 4, fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, marginBottom: 12 }}>
                      📍 Active Mission: {batch.mission}
                    </div>
                  )}

                  {/* Batch Members Roster */}
                  <div style={{ background: 'var(--bg-card)', padding: '8px 10px', borderRadius: 4, border: '1px solid var(--border)', marginBottom: 14 }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
                      Personnel Roster ({batch.memberCount} Members)
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {batch.members.map((m, mi) => (
                        <span key={mi} style={{ fontSize: '0.72rem', background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 3, border: '1px solid var(--border)' }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {isAvail ? '🟢 Ready to Dispatch' : '🚀 In Field Operations'}
                  </span>
                  <button
                    type="button"
                    className={`btn btn-sm ${isAvail ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleToggleStatus(batch.batchCode)}
                  >
                    {isAvail ? '🚀 Dispatch Batch' : '↩ Recall to Standby'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <DataTable columns={tableColumns} data={filteredBatches} emptyMessage="No response team batches found." />
        </div>
      )}
    </PageWrapper>
  );
}
