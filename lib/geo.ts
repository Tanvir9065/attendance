export type Pos = { lat: number; lng: number; acc: number };
export const getPos = () => new Promise<Pos>((res, rej) =>
  navigator.geolocation.getCurrentPosition(
    (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }),
    () => rej(new Error("Location allow karo")), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }));
export function meters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000, r = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
