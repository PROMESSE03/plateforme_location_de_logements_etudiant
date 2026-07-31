export const UQAC_COORDS = { latitude: 48.42, longitude: -71.0525 };

// Formule de Haversine, en km — même logique que côté backend, utilisée ici
// uniquement pour l'affichage (le vrai filtrage se fait côté serveur).
export function distanceFromUqacKm(lat: number, lng: number): number {
  const R = 6371;
  const dLat = ((lat - UQAC_COORDS.latitude) * Math.PI) / 180;
  const dLng = ((lng - UQAC_COORDS.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((UQAC_COORDS.latitude * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m du campus`;
  return `${km.toFixed(1)} km du campus`;
}
