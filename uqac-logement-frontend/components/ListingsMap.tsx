"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { Listing, photoUrl } from "@/lib/api";
import { UQAC_COORDS, distanceFromUqacKm, formatDistance } from "@/lib/uqac";
import { TYPE_LABELS } from "@/components/ListingCard";

// Icône personnalisée (pin vert, dans la couleur de la marque) — évite le
// bug classique des icônes par défaut de Leaflet qui cassent avec Next.js.
const pinIcon = new L.DivIcon({
  className: "",
  html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.7 0 0 6.7 0 15c0 11.3 15 25 15 25s15-13.7 15-25C30 6.7 23.3 0 15 0Z" fill="#1f6f5c"/>
    <circle cx="15" cy="15" r="6" fill="white"/>
  </svg>`,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -36],
});

const uqacIcon = new L.DivIcon({
  className: "",
  html: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" fill="white" stroke="#1f6f5c" stroke-width="2"/>
    <path d="M12 21v6c0 1.8 3.6 3.5 8 3.5s8-1.700 8-3.500v-6l-8 4Z" fill="#1f6f5c"/>
    <path d="M20 11 6 18l14 7 14-7Z" fill="#1f6f5c"/>
    <path d="M31.500 19.300V26" fill="none" stroke="#1f6f5c" stroke-width="1.500"/>
    <circle cx="31.500" cy="27" r="1.500" fill="#1f6f5c"/>
  </svg>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -18],
});

// Recentre la carte quand la liste d'annonces change (ex: après un filtre)
function FitBounds({ listings }: { listings: Listing[] }) {
  const map = useMap();
  useEffect(() => {
    if (listings.length === 0) {
      map.setView([UQAC_COORDS.latitude, UQAC_COORDS.longitude], 13);
      return;
    }
    const bounds = L.latLngBounds(
      listings.map((l) => [l.latitude, l.longitude] as [number, number]),
    );
    bounds.extend([UQAC_COORDS.latitude, UQAC_COORDS.longitude]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, [listings, map]);
  return null;
}

export function ListingsMap({ listings }: { listings: Listing[] }) {
  return (
    <MapContainer
      center={[UQAC_COORDS.latitude, UQAC_COORDS.longitude]}
      zoom={13}
      scrollWheelZoom
      zoomControl={false}
      className="h-full w-full"
    >
      {/* En bas : les bulles s'ouvrent vers le haut et passeraient dessous */}
      <ZoomControl position="bottomleft" />
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={[UQAC_COORDS.latitude, UQAC_COORDS.longitude]} icon={uqacIcon}>
        <Popup>Campus de l&apos;UQAC</Popup>
      </Marker>

      {listings.map((listing) => (
        <Marker
          key={listing.id}
          position={[listing.latitude, listing.longitude]}
          icon={pinIcon}
        >
          <Popup className="listing-popup">
            <div className="w-[240px]">
              {/* Hauteur fixe : Leaflet positionne la bulle avant le chargement de l'image. */}
              <div className="relative h-[130px] bg-paper">
                {listing.photos?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl(listing.photos[0].url)}
                    alt={listing.titre}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-ink-muted/40">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5Z" />
                    </svg>
                  </div>
                )}
                <div className="absolute left-2.5 top-2.5 rounded-full bg-ink/85 px-2.5 py-1 text-xs font-medium text-white">
                  {formatDistance(distanceFromUqacKm(listing.latitude, listing.longitude))}
                </div>
              </div>

              <div className="p-3.5">
                <div className="font-display text-base font-semibold leading-snug text-ink">
                  {listing.titre}
                </div>
                <div className="mt-0.5 text-xs text-ink-muted">
                  {TYPE_LABELS[listing.typeLogement] ?? listing.typeLogement} ·{" "}
                  {listing.nbChambres} {listing.nbChambres > 1 ? "chambres" : "chambre"}
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="whitespace-nowrap font-display text-lg font-semibold text-ink">
                    {Number(listing.prix).toFixed(0)}$
                    <span className="font-sans text-xs font-normal text-ink-muted"> /mois</span>
                  </div>
                  {/* ! : les styles de lien de Leaflet passent sinon avant ceux de Tailwind */}
                  <Link
                    href={`/listings/${listing.id}`}
                    className="whitespace-nowrap rounded-lg bg-primary px-3 py-2 text-xs font-medium !text-white transition-colors hover:bg-primary-dark"
                  >
                    Voir l&apos;annonce
                  </Link>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      <FitBounds listings={listings} />
    </MapContainer>
  );
}
