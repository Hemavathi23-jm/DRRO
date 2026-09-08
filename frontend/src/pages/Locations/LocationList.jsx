import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import OperationalMap from '../../components/map/OperationalMap';
import { useAsyncData } from '../../hooks/useAsyncData';
import { dashboardApi, disasterApi, locationApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

async function fetchAllLocations() {
  const disasters = await disasterApi.list();
  const batches = await Promise.all(
    disasters.map(async (d) => {
      const locs = await locationApi.list(d.disasterId);
      return locs.map(l => ({ ...l, id: l.locationId, disasterTitle: l.disasterTitle || d.title }));
    })
  );
  return batches.flat();
}

export default function LocationList() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [mapTarget, setMapTarget] = useState(null);
  const [safePlaces, setSafePlaces] = useState(null);
  const [safePlaceLoc, setSafePlaceLoc] = useState(null);
  const [safeLoading, setSafeLoading] = useState(false);
  const [safeError, setSafeError] = useState('');
  const { data, loading, error, refetch } = useAsyncData(fetchAllLocations, []);

  const loadSafePlaces = async (loc) => {
    setSafeLoading(true);
    setSafeError('');
    setSafePlaceLoc(loc);
    setSafePlaces(null);
    try {
      const places = await dashboardApi.safePlaces(loc.locationId, 20);
      setSafePlaces(places || []);
    } catch (e) {
      setSafeError(e.response?.data?.message || e.message || 'Unable to load safe places');
      setSafePlaces([]);
    } finally {
      setSafeLoading(false);
    }
  };

  const columns = [
    { label: 'Location', accessor: 'name', render: r => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { label: 'Disaster', accessor: 'disasterTitle' },
    { label: 'Population', accessor: 'populationAffected', render: r => (r.populationAffected ?? 0).toLocaleString() },
    { label: 'Severity', accessor: 'severityScore', render: r => <span style={{ color: (r.severityScore ?? 0) >= 80 ? 'var(--danger)' : 'var(--warning)', fontWeight: 600 }}>{r.severityScore ?? '—'}</span> },
    { label: 'Accessibility', accessor: 'accessibility', render: r => r.accessibility ? <StatusBadge status={r.accessibility} /> : '—' },
    { label: 'Fulfillment', accessor: 'fulfillmentStatus', render: r => r.fulfillmentStatus ? <StatusBadge status={r.fulfillmentStatus} /> : '—' },
    { label: 'Open Requests', accessor: 'openRequestCount', render: r => <span style={{ color: (r.openRequestCount ?? 0) > 0 ? 'var(--warning)' : 'var(--success)' }}>{r.openRequestCount ?? 0}</span> },
    {
      label: 'Actions', accessor: 'locationId', render: r => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-secondary btn-sm" type="button"
            onClick={() => setMapTarget({ lat: Number(r.latitude), lng: Number(r.longitude), zoom: 13, name: r.name })}>
            Map
          </button>
          <button className="btn btn-secondary btn-sm" type="button" onClick={() => loadSafePlaces(r)}>
            Safe Places
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <PageWrapper><LoadingSpinner message="Loading locations…" /></PageWrapper>;
  if (error) return (
    <PageWrapper>
      <div className="empty-state">
        <p>Unable to load locations. {error}</p>
        <button className="btn btn-primary mt-2" onClick={refetch}>Try again</button>
      </div>
    </PageWrapper>
  );

  const locations = data || [];
  const safeMarkers = (safePlaces || [])
    .filter(p => p.latitude && p.longitude)
    .map((p, i) => ({
      id: p.osmId || p.centerId || i,
      category: 'resource_center',
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
      status: p.type,
    }));

  return (
    <PageWrapper>
      <div className="flex-between page-header">
        <div>
          <h2 className="page-title">Affected Locations</h2>
          <p className="page-sub">{locations.length} registered locations</p>
        </div>
        {hasRole('OFFICER', 'ADMIN') && (
          <button className="btn btn-primary" onClick={() => navigate('/locations/create')}>Add Location</button>
        )}
      </div>

      {mapTarget && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="flex-between" style={{ marginBottom: 10 }}>
            <p className="card-title" style={{ margin: 0 }}>{mapTarget.name}</p>
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => setMapTarget(null)}>Close Map</button>
          </div>
          <OperationalMap
            height={320}
            zoom={mapTarget.zoom}
            flyTo={mapTarget}
            markers={locations.filter(l => l.latitude && l.longitude).map(l => ({
              id: l.locationId,
              category: 'location',
              name: l.name,
              latitude: l.latitude,
              longitude: l.longitude,
              populationAffected: l.populationAffected,
              status: l.fulfillmentStatus,
            }))}
          />
        </div>
      )}

      {(safeLoading || safePlaces) && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="flex-between" style={{ marginBottom: 10 }}>
            <div>
              <p className="card-title" style={{ margin: 0 }}>
                Nearby Safe Places{safePlaceLoc ? ` — ${safePlaceLoc.name}` : ''}
              </p>
              <p className="text-muted" style={{ fontSize: '0.786rem', marginTop: 4 }}>
                Sources: internal shelters and OpenStreetMap (hospitals, shelters, clinics)
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => { setSafePlaces(null); setSafePlaceLoc(null); setSafeError(''); }}>
              Close
            </button>
          </div>
          {safeLoading && <LoadingSpinner message="Fetching nearby facilities…" />}
          {safeError && <p className="form-error">{safeError}</p>}
          {!safeLoading && safePlaces && safePlaces.length === 0 && (
            <p className="text-muted">No nearby facilities found within range.</p>
          )}
          {!safeLoading && safePlaces && safePlaces.length > 0 && (
            <>
              {safePlaceLoc?.latitude && (
                <div style={{ marginBottom: 12 }}>
                  <OperationalMap
                    height={280}
                    zoom={12}
                    flyTo={{ lat: Number(safePlaceLoc.latitude), lng: Number(safePlaceLoc.longitude), zoom: 12 }}
                    markers={[
                      {
                        id: safePlaceLoc.locationId,
                        category: 'location',
                        name: safePlaceLoc.name,
                        latitude: safePlaceLoc.latitude,
                        longitude: safePlaceLoc.longitude,
                      },
                      ...safeMarkers,
                    ]}
                  />
                </div>
              )}
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Source</th>
                    <th>Distance</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  {safePlaces.map((p, i) => (
                    <tr key={p.osmId || p.centerId || i}>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td>{p.type}</td>
                      <td><span className="role-badge">{p.source || '—'}</span></td>
                      <td>{p.distanceKm != null ? `${p.distanceKm} km` : '—'}</td>
                      <td className="text-muted">{p.address || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-muted" style={{ marginTop: 10, fontSize: '0.786rem' }}>
                {safePlaces[0]?.disclaimer || 'Verify with authorities before use.'}
              </p>
            </>
          )}
        </div>
      )}

      <div className="card">
        <DataTable columns={columns} data={locations} emptyMessage="No locations registered." />
      </div>
    </PageWrapper>
  );
}
