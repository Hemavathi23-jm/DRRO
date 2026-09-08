import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import PriorityCard from '../../components/common/PriorityCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAsyncData } from '../../hooks/useAsyncData';
import { allocationApi } from '../../services/api';

function buildFactors(a) {
  return {
    severityScore: a.severityScore,
    populationScore: a.populationScore,
    urgencyScore: a.urgencyScore,
    shortageScore: a.shortageScore,
    travelTimeScore: a.travelTimeScore,
    vulnerabilityScore: a.vulnerabilityScore,
    explanationText: a.explanationText,
  };
}

export default function ApprovalPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: a, loading, error, refetch } = useAsyncData(() => allocationApi.get(id), [id]);
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    if (a?.allocatedQty != null) setQty(String(a.allocatedQty));
  }, [a]);

  if (loading) return <PageWrapper><LoadingSpinner message="Loading allocation…" /></PageWrapper>;
  if (error) return (
    <PageWrapper>
      <div className="empty-state">
        <p>Unable to load allocation. {error}</p>
        <button className="btn btn-primary mt-2" onClick={refetch}>Try again</button>
      </div>
    </PageWrapper>
  );
  if (!a) return <PageWrapper><p style={{ color: 'var(--danger)', padding: 24 }}>Not found.</p></PageWrapper>;

  const score = a.finalScore ?? a.priorityScore ?? 0;

  const handleAction = async (decision) => {
    setSubmitting(true);
    try {
      const payload = { decision, notes: notes || null };
      if (decision === 'MODIFIED') payload.overrideQty = Number(qty);
      await allocationApi.decide(id, payload);
      setDone(decision);
      setTimeout(() => navigate('/allocation'), 1400);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit decision');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="flex-between page-header">
        <div><h2 className="page-title">Review Allocation #{a.allocationId}</h2><p className="page-sub">Request #{a.requestId} · {a.resourceTypeName}</p></div>
        <button className="btn btn-secondary" onClick={() => navigate('/allocation')}>← Back</button>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <p className="card-title" style={{ marginBottom: 12 }}>Modify Before Approval</p>
          <div className="form-group">
            <label className="form-label">Allocated Quantity (original: {a.allocatedQty})</label>
            <input className="form-input" type="number" min={1} value={qty} onChange={e => setQty(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Review Notes</label>
            <textarea className="form-textarea" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…" style={{ resize: 'vertical' }} />
          </div>
          {done && (
            <p style={{ color: done === 'REJECTED' ? 'var(--danger)' : 'var(--success)', marginBottom: 12, fontWeight: 600 }}>
              {done === 'REJECTED' ? 'Rejected.' : done === 'MODIFIED' ? 'Modified and approved.' : 'Approved.'} Redirecting…
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-success" disabled={submitting} onClick={() => handleAction('APPROVED')}>Approve</button>
            <button className="btn btn-danger" disabled={submitting} onClick={() => handleAction('REJECTED')}>Reject</button>
            <button className="btn btn-secondary" disabled={submitting} onClick={() => handleAction('MODIFIED')}>Modify and Approve</button>
          </div>
        </div>
        <PriorityCard score={score} factors={buildFactors(a)} />
      </div>
    </PageWrapper>
  );
}
