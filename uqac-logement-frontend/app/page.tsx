"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { api, Listing, ApiError } from "@/lib/api";
import { ListingCard } from "@/components/ListingCard";
import { HeroCarousel } from "@/components/HeroCarousel";
import { ContactForm } from "@/components/ContactForm";

// Leaflet accède à `window` dès son chargement — impossible à rendre côté
// serveur, donc on le charge uniquement dans le navigateur.
const ListingsMap = dynamic(
  () => import("@/components/ListingsMap").then((mod) => mod.ListingsMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-ink-muted">
        Chargement de la carte...
      </div>
    ),
  },
);

const TYPES = [
  { value: "", label: "Tous les types" },
  { value: "chambre", label: "Chambre" },
  { value: "studio", label: "Studio" },
  { value: "appartement", label: "Appartement" },
  { value: "colocation", label: "Colocation" },
];

// text-base sur mobile : sous 16px, iOS zoome sur la page au focus du champ.
const FIELD_CLASS =
  "h-12 w-full rounded-xl border border-border bg-paper text-base text-ink transition outline-none hover:border-ink-muted/40 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10 sm:text-sm";

function FilterField({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

function NumberFilter({
  label,
  unit,
  placeholder,
  value,
  onChange,
  step,
  className,
}: {
  label: string;
  unit: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  step?: number;
  className?: string;
}) {
  return (
    <FilterField label={label} className={className}>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${FIELD_CLASS} pl-3.5 pr-10 [appearance:textfield] placeholder:text-ink-muted/70 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-ink-muted">
          {unit}
        </span>
      </div>
    </FilterField>
  );
}

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [prixMin, setPrixMin] = useState("");
  const [prixMax, setPrixMax] = useState("");
  const [type, setType] = useState("");
  const [distanceKm, setDistanceKm] = useState("");

  const hasFilters = Boolean(prixMin || prixMax || type || distanceKm);
  const invalidPriceRange =
    prixMin !== "" && prixMax !== "" && Number(prixMin) > Number(prixMax);

  function resetFilters() {
    setPrixMin("");
    setPrixMax("");
    setType("");
    setDistanceKm("");
  }

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.searchListings({
        prix_min: prixMin ? Number(prixMin) : undefined,
        prix_max: prixMax ? Number(prixMax) : undefined,
        type_logement: type || undefined,
        distance_km: distanceKm ? Number(distanceKm) : undefined,
      });
      setListings(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de charger les annonces");
    } finally {
      setLoading(false);
    }
  }, [prixMin, prixMax, type, distanceKm]);

  // Petit délai : évite une requête (et un clignotement) à chaque touche.
  useEffect(() => {
    const timer = setTimeout(fetchListings, 300);
    return () => clearTimeout(timer);
  }, [fetchListings]);

  return (
    <div>
      {/* Carrousel héro */}
      <HeroCarousel />

      {/* Filtres */}
      <section className="border-b border-border bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
            {/* Mobile : type et distance sur toute la largeur, prix côte à côte */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <FilterField label="Type de logement" className="col-span-2 lg:col-span-1">
                <div className="relative">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className={`${FIELD_CLASS} cursor-pointer appearance-none pl-3.5 pr-10`}
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
                  >
                    <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </FilterField>

              <NumberFilter
                label="Prix min / mois"
                unit="$"
                placeholder="400"
                value={prixMin}
                onChange={setPrixMin}
              />

              <NumberFilter
                label="Prix max / mois"
                unit="$"
                placeholder="800"
                value={prixMax}
                onChange={setPrixMax}
              />

              <NumberFilter
                label="Distance de l'UQAC"
                unit="km"
                placeholder="2"
                step={0.5}
                value={distanceKm}
                onChange={setDistanceKm}
                className="col-span-2 lg:col-span-1"
              />
            </div>

            {(invalidPriceRange || hasFilters) && (
              <div className="mt-3 flex items-center justify-between gap-4">
                <p role="alert" className="text-sm text-danger">
                  {invalidPriceRange &&
                    "Le prix minimum dépasse le prix maximum."}
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="shrink-0 py-1 text-sm font-medium text-primary hover:text-primary-dark"
                >
                  Réinitialiser
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Résultats */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        {loading && (
          <p className="text-ink-muted">Chargement des annonces...</p>
        )}

        {error && (
          <p className="rounded-lg bg-danger-bg px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="text-ink-muted">
              Aucune annonce ne correspond à ces critères pour le moment.
            </p>
          </div>
        )}

        {!loading && listings.length > 0 && (
          <>
            <p className="mb-5 text-sm text-ink-muted">
              {listings.length} annonce{listings.length > 1 ? "s" : ""}{" "}
              disponible{listings.length > 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Carte */}
      <section id="carte" className="border-t border-border bg-surface py-12">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl font-semibold text-ink">
            Toutes les annonces sur la carte
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Chapeau de diplômé = campus de l&apos;UQAC. Épingles vertes =
            logements disponibles.
          </p>
          <div className="mt-6 h-[420px] w-full overflow-hidden rounded-2xl border border-border">
            <ListingsMap listings={listings} />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="border-t border-border bg-paper py-12">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="font-display text-2xl font-semibold text-ink">
            Une question ?
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Écris-nous, on te répond directement par courriel.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
