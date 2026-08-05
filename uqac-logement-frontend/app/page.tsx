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

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [prixMax, setPrixMax] = useState("");
  const [type, setType] = useState("");
  const [distanceKm, setDistanceKm] = useState("");

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.searchListings({
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
  }, [prixMax, type, distanceKm]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return (
    <div>
      {/* Carrousel héro */}
      <HeroCarousel />

      {/* Filtres */}
      <section className="border-b border-border bg-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end gap-4 px-6 py-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Type
            </span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Prix max / mois
            </span>
            <input
              type="number"
              min={0}
              placeholder="ex: 600"
              value={prixMax}
              onChange={(e) => setPrixMax(e.target.value)}
              className="w-32 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Distance max de l&apos;UQAC (km)
            </span>
            <input
              type="number"
              min={0}
              step={0.5}
              placeholder="ex: 2"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              className="w-40 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
          </label>
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
            Repère orange = campus de l&apos;UQAC. Épingles vertes =
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
