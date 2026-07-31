"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, Listing, ApiError } from "@/lib/api";

const STATUT_STYLES: Record<string, { label: string; className: string }> = {
  en_attente: { label: "En attente de validation", className: "bg-warning-bg text-warning" },
  approuvee: { label: "Approuvée", className: "bg-success-bg text-success" },
  rejetee: { label: "Rejetée", className: "bg-danger-bg text-danger" },
};

export default function MyListingsPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (token) {
      api
        .myListings(token)
        .then(setListings)
        .catch((err) =>
          setError(err instanceof ApiError ? err.message : "Erreur de chargement"),
        )
        .finally(() => setLoading(false));
    }
  }, [authLoading, user, token, router]);

  if (authLoading || !user) return null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">Mes annonces</h1>
        <Link
          href="/listings/new"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          + Nouvelle annonce
        </Link>
      </div>

      {loading && <p className="text-ink-muted">Chargement...</p>}
      {error && (
        <p className="rounded-lg bg-danger-bg px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {!loading && listings.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-ink-muted">Tu n&apos;as encore publié aucune annonce.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {listings.map((listing) => {
          const statut = STATUT_STYLES[listing.statut] ?? STATUT_STYLES.en_attente;
          return (
            <div
              key={listing.id}
              className="flex items-center justify-between rounded-xl border border-border bg-surface px-5 py-4"
            >
              <div>
                <p className="font-display font-semibold text-ink">{listing.titre}</p>
                <p className="text-sm text-ink-muted">
                  {Number(listing.prix).toFixed(0)}$/mois · {listing.adresse}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${statut.className}`}
              >
                {statut.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
