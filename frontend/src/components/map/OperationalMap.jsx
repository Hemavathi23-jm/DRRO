import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

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
  team: '#16a34a',
  dispatch: '#7c3aed',
  safe_place: '#059669',
};

function makeIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function makeTruckIcon(status) {
  const bg = status === 'IN_TRANSIT' ? '#7c3aed' : status === 'DELIVERED' ? '#059669' : '#d97706';
  return L.divIcon({
    className: '',
    html: `<div style="background:${bg};color:#fff;font-size:13px;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);cursor:pointer;" title="Transit Vehicle">🚚</div>`,
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

export default function OperationalMap({
  markers = [],
  routes = [],
  height = 400,
  center = [20.5937, 78.9629],
  zoom = 5,
  flyTo = null,
  onMarkerClick,
}) {
  return (
    <div className="map-container" style={{ height, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {flyTo && <FlyTo center={flyTo} zoom={flyTo.zoom} />}

        {/* Standard Markers */}
        {markers.filter(m => m.latitude && m.longitude).map(m => (
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
                {m.populationAffected != null && <div>Population: {m.populationAffected?.toLocaleString()}</div>}
                {m.locationSource === 'LAST_KNOWN' && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                    Last known location (not live GPS)
                  </div>
                )}
                {m.disclaimer && <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>{m.disclaimer}</div>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Transit Routes & Vehicles */}
        {routes
          .filter(r => r.origin?.lat && r.origin?.lng && r.destination?.lat && r.destination?.lng)
          .map((route, idx) => {
            const originPos = [Number(route.origin.lat), Number(route.origin.lng)];
            const destPos = [Number(route.destination.lat), Number(route.destination.lng)];
            const midPos = [
              (originPos[0] + destPos[0]) / 2,
              (originPos[1] + destPos[1]) / 2,
            ];
            const isTransit = route.status === 'IN_TRANSIT';
            const isDelivered = route.status === 'DELIVERED';
            const color = isTransit ? '#7c3aed' : isDelivered ? '#059669' : '#d97706';

            return (
              <div key={`route-group-${route.id || idx}`}>
                <Polyline
                  positions={[originPos, destPos]}
                  pathOptions={{
                    color,
                    weight: isTransit ? 4 : 3,
                    dashArray: isTransit ? '6, 8' : undefined,
                    opacity: 0.85,
                  }}
                >
                  <Tooltip sticky>
                    <div style={{ fontSize: '0.8rem' }}>
                      <strong>{route.originName || 'Warehouse'} ➔ {route.destinationName || 'Disaster Site'}</strong>
                      {route.payload && <div>Cargo: {route.payload}</div>}
                      <div>Status: <strong>{route.status || 'IN_TRANSIT'}</strong></div>
                    </div>
                  </Tooltip>
                </Polyline>

                {/* Truck marker at midpoint or current vehicle position */}
                <Marker
                  position={route.currentPos ? [Number(route.currentPos.lat), Number(route.currentPos.lng)] : midPos}
                  icon={makeTruckIcon(route.status)}
                >
                  <Popup>
                    <div style={{ minWidth: 180, fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 700, color, marginBottom: 4 }}>
                        🚚 Dispatch #{route.id || idx + 1} ({route.status || 'IN_TRANSIT'})
                      </div>
                      <div><strong>From:</strong> {route.originName || 'Resource Center'}</div>
                      <div><strong>To:</strong> {route.destinationName || 'Impact Zone'}</div>
                      {route.payload && <div style={{ marginTop: 4 }}><strong>Payload:</strong> {route.payload}</div>}
                      {route.teamName && <div><strong>Team:</strong> {route.teamName}</div>}
                      {route.eta && <div style={{ marginTop: 4, color: '#64748b' }}>⏱ ETA: {route.eta}</div>}
                    </div>
                  </Popup>
                </Marker>
              </div>
            );
          })}
      </MapContainer>
    </div>
  );
}

export { COLORS as MAP_COLORS };
