"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { Listing } from "@/lib/api";
import { UQAC_COORDS } from "@/lib/uqac";

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
  html: `<svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">
    <circle cx="13" cy="13" r="10" fill="#e0654a" stroke="white" stroke-width="3"/>
  </svg>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
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
      className="h-full w-full"
    >
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
          <Popup>
            <div className="min-w-[160px]">
              <p className="font-semibold">{listing.titre}</p>
              <p className="text-sm text-gray-600">
                {Number(listing.prix).toFixed(0)}$/mois
              </p>
              <Link
                href={`/listings/${listing.id}`}
                className="mt-1 inline-block text-sm font-medium text-[#1f6f5c] hover:underline"
              >
                Voir l&apos;annonce →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}

      <FitBounds listings={listings} />
    </MapContainer>
  );
}
