import { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAsyncData } from '../../hooks/useAsyncData';
import { weightApi } from '../../services/api';

const WEIGHT_KEYS = [
  { key: 'severity', apiKey: 'weightSeverity', label: 'Disaster Severity (wS)', desc: 'Impact of overall disaster and local severity score' },
  { key: 'population', apiKey: 'weightPopulation', label: 'Affected Population (wP)', desc: 'Density and count of people in distress' },
  { key: 'urgency', apiKey: 'weightUrgency', label: 'Request Urgency (wU)', desc: 'Urgency tier (Critical/High) + time to deadline' },
  { key: 'shortage', apiKey: 'weightShortage', label: 'Resource Shortage / Deficit (wD)', desc: 'Unmet proportion of requested supplies' },
  { key: 'travel', apiKey: 'weightTravel', label: 'Logistics / Travel Time (wT)', desc: 'Distance & estimated delivery travel time penalty' },
  { key: 'vulnerability', apiKey: 'weightVulnerability', label: 'Location Vulnerability (wV)', desc: 'Demographic vulnerability and terrain difficulty' },
];

const DEFAULTS = { severity: 25, population: 20, urgency: 20, shortage: 20, travel: 10, vulnerability: 5 };

function fromApiResponse(active) {
  if (!active) return { ...DEFAULTS };
  return {
    severity: Math.round(Number(active.weightSeverity) * 100),
    population: Math.round(Number(active.weightPopulation) * 100),
    urgency: Math.round(Number(active.weightUrgency) * 100),
    shortage: Math.round(Number(active.weightShortage) * 100),
    travel: Math.round(Number(active.weightTravel) * 100),
    vulnerability: Math.round(Number(active.weightVulnerability) * 100),
  };
}

export default function WeightConfig() {
  const { data: active, loading, error, refetch } = useAsyncData(() => weightApi.active(), []);
  const [weights, setWeights] = useState(DEFAULTS);
  const [configName, setConfigName] = useState('Custom Configuration');
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (active) {
      setWeights(fromApiResponse(active));
      if (active.configName) setConfigName(active.configName);
    }
  }, [active]);

  const total = Object.values(weights).reduce((a, b) => a + Number(b), 0);
  const isValid = total === 100;

  const updateWeight = (key, val) => {
    setWeights(prev => ({ ...prev, [key]: parseInt(val, 10) || 0 }));
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setSaveError(null);
    try {
      await weightApi.create({
        configName,
        weightSeverity: weights.severity / 100,
        weightPopulation: weights.population / 100,
        weightUrgency: weights.urgency / 100,
        weightShortage: weights.shortage / 100,
        weightTravel: weights.travel / 100,
        weightVulnerability: weights.vulnerability / 100,
      });
      setSaved(true);
      refetch();
    } catch (err) {
      setSaveError(err.response?.data?.message || err.message || 'Failed to save weights');
    } finally {
      setSubmitting(false);
    }
  };

  const resetDefaults = () => {
    setWeights({ ...DEFAULTS });
    setSaved(false);
  };

  if (loading) return <PageWrapper><LoadingSpinner message="Loading weight configuration…" /></PageWrapper>;
  if (error) return (
    <PageWrapper>
      <div className="empty-state">
        <p>Unable to load weights. {error}</p>
        <button className="btn btn-primary mt-2" onClick={refetch}>Try again</button>
      </div>
    </PageWrapper>
  );

  return (
    <PageWrapper>
      <div className="flex-between page-header">
        <div>
          <h2 className="page-title">Priority Weight Configuration</h2>
          <p className="page-sub">
            Tune the multi-factor scoring formula for the allocation engine
            {active?.configName && <> · Active: <strong>{active.configName}</strong></>}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={resetDefaults}>Reset Defaults</button>
      </div>

      <div style={{ maxWidth: 640 }}>
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <span className="card-title" style={{ margin: 0 }}>Allocation Formula Multipliers</span>
            <div className={`validation-badge ${isValid ? 'validation-badge--valid' : 'validation-badge--invalid'}`}>
              Sum: {total}% / 100% {isValid ? '(Valid)' : '(Must equal 100%)'}
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Configuration Name</label>
              <input className="form-input" value={configName} onChange={e => setConfigName(e.target.value)} required />
            </div>

            {WEIGHT_KEYS.map(item => (
              <div key={item.key} style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex-between" style={{ marginBottom: 4 }}>
                  <div>
                    <label className="form-label" style={{ margin: 0 }}>{item.label}</label>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '1rem' }}>
                    {weights[item.key]}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={weights[item.key]}
                  onChange={e => updateWeight(item.key, e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
              </div>
            ))}

            {saveError && <p style={{ color: 'var(--danger)', marginBottom: 12, fontSize: '0.875rem' }}>{saveError}</p>}
            {saved && (
              <p style={{ color: 'var(--success)', marginBottom: 12, fontSize: '0.875rem' }}>
                Priority weight configuration saved and active.
              </p>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-primary" type="submit" disabled={!isValid || submitting}>
                {submitting ? 'Saving…' : 'Save & Apply Weights'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}
