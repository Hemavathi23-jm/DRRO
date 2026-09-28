import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useMemo } from 'react';
import { truckIconSvg } from '../common/Icon';

// Fix default marker icons in Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl: iconRetina, shadowUrl });

const COLORS = {
  disaster: '#dc2626',
  location: '#ea580c',
  resource_center: '#2563eb',
  team: '#059669',
  dispatch: '#1d4ed8',
  safe_place: '#14b8a6',
};

/** Simple in-memory cache so routes aren't re-fetched on every render */
const routeCache = new Map();

function routeCacheKey(origin, dest) {
  const oLat = Number(origin.lat).toFixed(5);
  const oLng = Number(origin.lng).toFixed(5);
  const dLat = Number(dest.lat).toFixed(5);
  const dLng = Number(dest.lng).toFixed(5);
  return `${oLat},${oLng}->${dLat},${dLng}`;
}

/**
 * Fetch a driving route that follows roads via the public OSRM demo server.
 * Returns Leaflet [lat, lng] positions, or null on failure.
 */
async function fetchRoadPath(origin, dest) {
  const key = routeCacheKey(origin, dest);
  if (routeCache.has(key)) return routeCache.get(key);

  const oLng = Number(origin.lng);
  const oLat = Number(origin.lat);
  const dLng = Number(dest.lng);
  const dLat = Number(dest.lat);

  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${oLng},${oLat};${dLng},${dLat}` +
    `?overview=full&geometries=geojson&steps=false`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = await res.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) throw new Error('No geometry');

    // GeoJSON is [lng, lat] → Leaflet wants [lat, lng]
    const positions = coords.map(([lng, lat]) => [lat, lng]);
    routeCache.set(key, positions);
    return positions;
  } catch {
    routeCache.set(key, null);
    return null;
  }
}

function midpointOfPath(positions) {
  if (!positions?.length) return null;
  const mid = Math.floor(positions.length / 2);
  return positions[mid];
}

function makeIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function makeTruckIcon(status) {
  const bg = status === 'IN_TRANSIT' ? '#0f766e' : status === 'DELIVERED' ? '#059669' : '#d97706';
  return L.divIcon({
    className: '',
    html: `<div style="background:${bg};color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);cursor:pointer;" title="Transit Vehicle">${truckIconSvg('#fff')}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function FlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center?.lat && center?.lng) {
      map.flyTo([center.lat, center.lng], zoom || 12, { duration: 0.8 });
    }
  }, [center, zoom, map]);
  return null;
}

/**
 * Draws a single dispatch route along actual roads (OSRM),
 * falling back to a straight line if routing is unavailable.
 */
function RoadRoute({ route, idx }) {
  const originPos = useMemo(
    () => [Number(route.origin.lat), Number(route.origin.lng)],
    [route.origin.lat, route.origin.lng],
  );
  const destPos = useMemo(
    () => [Number(route.destination.lat), Number(route.destination.lng)],
    [route.destination.lat, route.destination.lng],
  );

  const [path, setPath] = useState([originPos, destPos]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchRoadPath(route.origin, route.destination).then((roadPath) => {
      if (cancelled) return;
      if (roadPath?.length >= 2) {
        setPath(roadPath);
      } else {
        setPath([originPos, destPos]);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [route.origin, route.destination, originPos, destPos]);

  const isTransit = route.status === 'IN_TRANSIT';
  const isDelivered = route.status === 'DELIVERED';
  const color = isTransit ? '#0f766e' : isDelivered ? '#059669' : '#d97706';

  const truckPos = route.currentPos
    ? [Number(route.currentPos.lat), Number(route.currentPos.lng)]
    : midpointOfPath(path) || [
        (originPos[0] + destPos[0]) / 2,
        (originPos[1] + destPos[1]) / 2,
      ];

  return (
    <>
      <Polyline
        positions={path}
        pathOptions={{
          color,
          weight: isTransit ? 4 : 3,
          dashArray: loading ? '4, 10' : isTransit ? '6, 8' : undefined,
          opacity: loading ? 0.45 : 0.9,
          lineJoin: 'round',
          lineCap: 'round',
        }}
      >
        <Tooltip sticky>
          <div style={{ fontSize: '0.8rem' }}>
            <strong>
              {route.originName || 'Warehouse'} → {route.destinationName || 'Disaster Site'}
            </strong>
            {route.payload && <div>Cargo: {route.payload}</div>}
            <div>
              Status: <strong>{route.status || 'IN_TRANSIT'}</strong>
            </div>
            <div style={{ color: '#64748b', marginTop: 2 }}>
              {loading ? 'Resolving road path…' : 'Road route'}
            </div>
          </div>
        </Tooltip>
      </Polyline>

      <Marker position={truckPos} icon={makeTruckIcon(route.status)}>
        <Popup>
          <div style={{ minWidth: 180, fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 700, color, marginBottom: 4 }}>
              Dispatch #{route.id || idx + 1} ({route.status || 'IN_TRANSIT'})
            </div>
            <div>
              <strong>From:</strong> {route.originName || 'Resource Center'}
            </div>
            <div>
              <strong>To:</strong> {route.destinationName || 'Impact Zone'}
            </div>
            {route.payload && (
              <div style={{ marginTop: 4 }}>
                <strong>Payload:</strong> {route.payload}
              </div>
            )}
            {route.teamName && (
              <div>
                <strong>Team:</strong> {route.teamName}
              </div>
            )}
            {route.eta && (
              <div style={{ marginTop: 4, color: '#64748b' }}>ETA: {route.eta}</div>
            )}
          </div>
        </Popup>
      </Marker>
    </>
  );
}

export default function OperationalMap({
  markers = [],
  routes = [],
  height = 400,
  center = [20.5937, 78.9629],
  zoom = 5,
  flyTo = null,
  onMarkerClick,
}) {
  const validRoutes = routes.filter(
    (r) =>
      r.origin?.lat &&
      r.origin?.lng &&
      r.destination?.lat &&
      r.destination?.lng &&
      r.status !== 'DELIVERED' &&
      r.status !== 'COMPLETED' &&
      r.status !== 'FAILED',
  );


  return (
    <div
      className="map-container"
      style={{
        height,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {flyTo && <FlyTo center={flyTo} zoom={flyTo.zoom} />}

        {markers
          .filter((m) => m.latitude && m.longitude)
          .map((m) => (
            <Marker
              key={`${m.category}-${m.id}`}
              position={[Number(m.latitude), Number(m.longitude)]}
              icon={makeIcon(COLORS[m.category] || '#64748b')}
              eventHandlers={{ click: () => onMarkerClick?.(m) }}
            >
              <Popup>
                <div style={{ minWidth: 160, fontSize: '0.85rem' }}>
                  <strong>{m.name}</strong>
                  {m.status && <div style={{ marginTop: 4 }}>Status: {m.status}</div>}
                  {m.populationAffected != null && (
                    <div>Population: {m.populationAffected?.toLocaleString()}</div>
                  )}
                  {m.locationSource === 'LAST_KNOWN' && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                      Last known location (not live GPS)
                    </div>
                  )}
                  {m.disclaimer && (
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                      {m.disclaimer}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

        {validRoutes.map((route, idx) => (
          <RoadRoute key={`route-${route.id || idx}`} route={route} idx={idx} />
        ))}
      </MapContainer>
    </div>
  );
}

export { COLORS as MAP_COLORS };
