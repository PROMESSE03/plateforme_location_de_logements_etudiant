"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, Listing, ApiError } from "@/lib/api";
import { distanceFromUqacKm, formatDistance } from "@/lib/uqac";

export default function AdminPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const isAdmin = user?.roles.includes("ROLE_ADMIN");

  const fetchPending = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.pendingListings(token);
      setListings(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (token && isAdmin) fetchPending();
    else if (!authLoading) setLoading(false);
  }, [authLoading, user, token, isAdmin, router, fetchPending]);

  async function handleApprove(id: string) {
    if (!token) return;
    setActingOn(id);
    try {
      await api.approveListing(id, token);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur");
    } finally {
      setActingOn(null);
    }
  }

  async function handleReject(id: string) {
    if (!token) return;
    setActingOn(id);
    try {
      await api.rejectListing(id, token);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur");
    } finally {
      setActingOn(null);
    }
  }

  if (authLoading || loading) {
    return <p className="mx-auto max-w-4xl px-6 py-16 text-ink-muted">Chargement...</p>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Accès réservé aux administrateurs
        </h1>
        <p className="mt-2 text-ink-muted">
          Ton compte n&apos;a pas le rôle admin sur cette page.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">
        Annonces à valider
      </h1>
      <p className="mt-2 text-ink-muted">
        {listings.length} annonce{listings.length !== 1 ? "s" : ""} en attente
        de validation.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {listings.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-ink-muted">Aucune annonce en attente pour le moment.</p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {listings.map((listing) => {
          const distance = distanceFromUqacKm(listing.latitude, listing.longitude);
          const busy = actingOn === listing.id;
          return (
            <div key={listing.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink">
                    {listing.titre}
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    {listing.adresse} · {formatDistance(distance)}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    Publiée par {listing.owner.nom} ({listing.owner.email})
                  </p>
                </div>
                <p className="whitespace-nowrap font-display text-lg font-semibold text-ink">
                  {Number(listing.prix).toFixed(0)}$/mois
                </p>
              </div>

              <p className="mt-3 text-sm text-ink-muted">{listing.description}</p>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => handleApprove(listing.id)}
                  disabled={busy}
                  className="rounded-full bg-success px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  Approuver
                </button>
                <button
                  onClick={() => handleReject(listing.id)}
                  disabled={busy}
                  className="rounded-full bg-danger px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  Rejeter
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
