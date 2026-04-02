import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LocationMapModal.css';

const ISSUE_ICONS = {
  police_harassment: '👮', extortion: '💰', unsafe_parking: '🅿️',
  accident_zone: '💥', poor_road: '🚧', other: '⚠️', emergency: '🆘',
};

function createPinIcon(type) {
  const emoji = ISSUE_ICONS[type] || '📍';
  return L.divIcon({
    className: '',
    html: `
      <div class="pin-wrapper">
        <div class="pin-pulse"></div>
        <div class="pin-marker">${emoji}</div>
      </div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48],
  });
}

function FlyToLocation({ lat, lng }) {
  const map = useMap();
  const didFly = useRef(false);
  useEffect(() => {
    if (!didFly.current) {
      map.flyTo([lat, lng], 17, { animate: true, duration: 1.2 });
      didFly.current = true;
    }
  }, [lat, lng, map]);
  return null;
}

export default function LocationMapModal({ location, onClose }) {
  const overlayRef = useRef(null);
  if (!location) return null;

  const { lat, lng, title, type, description, address } = location;
  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  const googleNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div className="loc-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="loc-modal">
        {/* Header */}
        <div className="loc-header">
          <div className="loc-header-info">
            <span className="loc-icon">{ISSUE_ICONS[type] || '📍'}</span>
            <div>
              <h3 className="loc-title">{title || 'Issue Location'}</h3>
              <p className="loc-address">
                📍 {address || `${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}`}
              </p>
            </div>
          </div>
          <button className="loc-close" onClick={onClose}>✕</button>
        </div>

        {/* Coordinates bar */}
        <div className="loc-coords-bar">
          <span className="loc-coord-item">🌐 Lat: <strong>{parseFloat(lat).toFixed(6)}</strong></span>
          <span className="loc-coord-item">🌐 Lng: <strong>{parseFloat(lng).toFixed(6)}</strong></span>
          {description && <span className="loc-coord-desc">{description}</span>}
        </div>

        {/* Map */}
        <div className="loc-map-container">
          <MapContainer
            center={[lat, lng]}
            zoom={15}
            minZoom={3}
            maxZoom={19}
            scrollWheelZoom={true}
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <ZoomControl position="bottomright" />
            <FlyToLocation lat={lat} lng={lng} />
            <Marker position={[lat, lng]} icon={createPinIcon(type)}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong>{ISSUE_ICONS[type] || '📍'} {(title || 'Issue').toUpperCase()}</strong>
                  {description && <p style={{ fontSize: 12, color: '#444', marginTop: 4 }}>{description}</p>}
                  <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                    {parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}
                  </p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* Action buttons */}
        <div className="loc-actions">
          <a href={googleNavUrl} target="_blank" rel="noreferrer" className="loc-btn loc-btn-nav">
            🧭 Navigate Here
          </a>
          <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="loc-btn loc-btn-gmaps">
            🗺️ Open in Google Maps
          </a>
          <button className="loc-btn loc-btn-copy" onClick={() => {
            navigator.clipboard?.writeText(`${lat},${lng}`);
          }}>
            📋 Copy Coordinates
          </button>
          <button className="loc-btn loc-btn-close" onClick={onClose}>✕ Close</button>
        </div>
      </div>
    </div>
  );
}
