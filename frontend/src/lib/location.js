// Lightweight location helper. Uses browser Geolocation + Nominatim reverse-geocoding.
// No API key required (Nominatim usage policy allows light client-side use).

const CACHE_KEY = "kh_location_cache_v1";

export function getCachedLocation() {
  try { const raw = localStorage.getItem(CACHE_KEY); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}

function setCachedLocation(loc) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(loc)); } catch { /* noop */ }
}

export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`, {
      headers: { "Accept-Language": "en" },
    });
    if (!res.ok) throw new Error("reverse-geocode failed");
    const d = await res.json();
    const a = d.address || {};
    const short = [a.road || a.neighbourhood, a.suburb || a.city_district, a.city || a.town || a.village, a.state].filter(Boolean).slice(0, 3).join(", ");
    return { display_name: d.display_name || short, short_name: short || d.display_name || `${lat.toFixed(4)},${lng.toFixed(4)}`, address: a };
  } catch (e) {
    return { display_name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, short_name: "Current location", address: {} };
  }
}

export function detectLocation({ timeout = 8000, useCache = true } = {}) {
  return new Promise((resolve, reject) => {
    if (useCache) {
      const cached = getCachedLocation();
      if (cached && Date.now() - cached.ts < 15 * 60 * 1000) {
        resolve(cached);
        return;
      }
    }
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const geo = await reverseGeocode(latitude, longitude);
        const loc = { lat: latitude, lng: longitude, ...geo, ts: Date.now() };
        setCachedLocation(loc);
        resolve(loc);
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout, maximumAge: 0 }
    );
  });
}

export function clearLocationCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* noop */ }
}
