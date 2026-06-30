import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom SVG markers (no need for default Leaflet image hosting)
function makeIcon(color, label) {
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 48' width='32' height='42'>
      <defs>
        <filter id='s' x='-20%' y='-20%' width='140%' height='140%'>
          <feDropShadow dx='0' dy='2' stdDeviation='2' flood-color='rgba(0,0,0,0.3)'/>
        </filter>
      </defs>
      <path filter='url(#s)' fill='${color}' d='M18 0C8 0 0 8 0 18c0 12 18 30 18 30s18-18 18-30C36 8 28 0 18 0z'/>
      <circle cx='18' cy='18' r='8' fill='white'/>
      <text x='18' y='22' text-anchor='middle' font-size='12' font-weight='700' fill='${color}' font-family='Outfit,Arial'>${label}</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "kh-marker",
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -36],
  });
}

const partnerIcon = makeIcon("#FF8A00", "P");
const customerIcon = makeIcon("#0F2D5C", "C");

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [points, map]);
  return null;
}

function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default function LiveTrackingMap({ customer, partner, height = 260 }) {
  // customer/partner: { lat, lng } or null
  const points = useMemo(() => {
    const list = [];
    if (partner?.lat != null && partner?.lng != null) list.push([partner.lat, partner.lng]);
    if (customer?.lat != null && customer?.lng != null) list.push([customer.lat, customer.lng]);
    return list;
  }, [customer, partner]);

  const distanceKm = useMemo(() => {
    if (points.length < 2) return null;
    return haversineKm(points[0], points[1]);
  }, [points]);

  if (points.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500" data-testid="live-map-empty">
        Waiting for partner to share live location…
      </div>
    );
  }

  const center = points[0];
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 relative" data-testid="live-map">
      <MapContainer
        center={center}
        zoom={14}
        style={{ height, width: "100%" }}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {partner?.lat != null && (
          <Marker position={[partner.lat, partner.lng]} icon={partnerIcon}>
            <Popup>Partner is here</Popup>
          </Marker>
        )}
        {customer?.lat != null && (
          <Marker position={[customer.lat, customer.lng]} icon={customerIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}
        {points.length === 2 && <Polyline positions={points} color="#FF8A00" weight={3} dashArray="6 6" />}
        <FitBounds points={points} />
      </MapContainer>
      {distanceKm != null && (
        <div className="absolute top-3 right-3 z-[400] kh-chip bg-white text-[#0F2D5C] shadow-md">
          {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m away` : `${distanceKm.toFixed(1)} km away`}
        </div>
      )}
    </div>
  );
}
