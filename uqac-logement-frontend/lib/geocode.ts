// Convertit une adresse en coordonnées (latitude/longitude) automatiquement,
// pour que l'utilisateur n'ait jamais à chercher ça lui-même.
// Utilise Nominatim (OpenStreetMap), un service gratuit.
export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const query = encodeURIComponent(`${address}, Chicoutimi, Saguenay, Québec`);
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
  );

  if (!res.ok) {
    throw new Error("Le service de géolocalisation est momentanément indisponible.");
  }

  const results = await res.json();
  if (!results || results.length === 0) {
    throw new Error(
      "Adresse introuvable. Essaie d'être plus précis (ex: ajoute le numéro civique).",
    );
  }

  return {
    latitude: parseFloat(results[0].lat),
    longitude: parseFloat(results[0].lon),
    displayName: results[0].display_name,
  };
}
