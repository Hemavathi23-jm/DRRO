import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import FilterBar from '../../components/common/FilterBar';
import OperationalMap from '../../components/map/OperationalMap';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { dashboardApi, disasterApi, locationApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const FILTER_DEFAULTS = { disasterId: 'ALL' };

async function fetchAllLocations() {
  const disasters = await disasterApi.list();
  const batches = await Promise.all(
    disasters.map(async (d) => {
      const locs = await locationApi.list(d.disasterId);
      return locs.map((l) => ({
        ...l,
        id: l.locationId,
        disasterTitle: l.disasterTitle || d.title,
        disasterId: l.disasterId || d.disasterId,
      }));
    }),
  );
  return batches.flat();
}

export default function LocationList() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const { values, setValue, clearAll } = useUrlFilters(FILTER_DEFAULTS);
  const [mapTarget, setMapTarget] = useState(null);
  const [safePlaces, setSafePlaces] = useState(null);
  const [safePlaceLoc, setSafePlaceLoc] = useState(null);
  const [safeLoading, setSafeLoading] = useState(false);
  const [safeError, setSafeError] = useState('');
  const { data, loading, error, refetch } = useAsyncData(fetchAllLocations, []);
  const { data: disasters } = useAsyncData(() => disasterApi.list(), []);

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

  const locations = useMemo(() => data || [], [data]);
  const filtered = useMemo(() => {
    let rows = locations;
    if (values.disasterId && values.disasterId !== 'ALL') {
      rows = rows.filter((l) => String(l.disasterId) === String(values.disasterId));
    }
    return rows;
  }, [locations, values]);

  const handleFulfillDemand = (loc) => {
    navigate(`/requests/create?disasterId=${loc.disasterId || ''}&locationId=${loc.locationId || ''}`);
  };

  const columns = [
    { label: 'Location', accessor: 'name', render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { label: 'Disaster', accessor: 'disasterTitle' },
    {
      label: 'Population',
      accessor: 'populationAffected',
      render: (r) => r.populationAffected?.toLocaleString?.() || r.populationAffected || '—',
    },
    {
      label: 'Demand Status',
      accessor: 'fulfillmentStatus',
      render: (r) => (
        <button
          type="button"
          onClick={() => handleFulfillDemand(r)}
          title="Click to fulfill relief demand for this location"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
        >
          <StatusBadge status={r.fulfillmentStatus || 'UNMET'} />
          <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--primary)', marginTop: 2, fontWeight: 600 }}>
            ⚡ Click to Fulfill
          </span>
        </button>
      ),
    },
    {
      label: 'Actions',
      accessor: 'locationId',
      render: (r) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className="btn btn-primary btn-sm"
            type="button"
            style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            onClick={() => handleFulfillDemand(r)}
            title="Book resources & fulfill demand for this location"
          >
            <span>⚡ Fulfill Demand</span>
          </button>
          <button
            className="btn btn-secondary btn-sm"
            type="button"
            style={{ fontSize: '0.78rem', padding: '4px 8px' }}
            onClick={() => setMapTarget({ ...r, lat: Number(r.latitude), lng: Number(r.longitude), zoom: 12 })}
          >
            Map
          </button>
          <button
            className="btn btn-secondary btn-sm"
            type="button"
            style={{ fontSize: '0.78rem', padding: '4px 8px' }}
            onClick={() => loadSafePlaces(r)}
          >
            Safe places
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <PageWrapper><LoadingSpinner message="Loading locations…" /></PageWrapper>;
  if (error) {
    return (
      <PageWrapper>
        <EmptyState
          title="Unable to load locations"
          description={String(error)}
          action={<button className="btn btn-primary" type="button" onClick={refetch}>Try again</button>}
        />
      </PageWrapper>
    );
  }

  const disasterOptions = [
    { value: 'ALL', label: 'All disasters' },
    ...(disasters || []).map((d) => ({ value: String(d.disasterId), label: d.title })),
  ];

  const safeMarkers = (safePlaces || [])
    .filter((p) => p.latitude && p.longitude)
    .map((p, i) => ({
      id: p.osmId || p.centerId || `safe-${i}`,
      category: 'safe_place',
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
    }));

  return (
    <PageWrapper>
      <PageHeader
        title="Affected locations"
        subtitle={`${locations.length} registered · ${filtered.length} shown`}
        actions={
          hasRole('OFFICER', 'ADMIN') && (
            <button className="btn btn-primary" type="button" onClick={() => navigate('/locations/create')}>
              Add location
            </button>
          )
        }
      />

      <FilterBar
        values={values}
        onChange={setValue}
        onClear={clearAll}
        resultCount={filtered.length}
        filters={[
          { key: 'disasterId', label: 'Disaster', type: 'select', options: disasterOptions },
        ]}
      />

      {mapTarget && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="flex-between" style={{ marginBottom: 10 }}>
            <p className="card-title" style={{ margin: 0 }}>{mapTarget.name}</p>
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => setMapTarget(null)}>Close map</button>
          </div>
          <OperationalMap
            height={320}
            zoom={mapTarget.zoom}
            flyTo={mapTarget}
            markers={locations.filter((l) => l.latitude && l.longitude).map((l) => ({
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
                Nearby safe places{safePlaceLoc ? ` — ${safePlaceLoc.name}` : ''}
              </p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={() => { setSafePlaces(null); setSafePlaceLoc(null); setSafeError(''); }}
            >
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
                  </tr>
                </thead>
                <tbody>
                  {safePlaces.map((p, i) => (
                    <tr key={p.osmId || p.centerId || i}>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td>{p.type}</td>
                      <td><span className="role-badge">{p.source || '—'}</span></td>
                      <td>{p.distanceKm != null ? `${p.distanceKm} km` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      <div className="card">
        <DataTable columns={columns} data={filtered} emptyMessage="No locations match these filters." />
      </div>
    </PageWrapper>
  );
}
