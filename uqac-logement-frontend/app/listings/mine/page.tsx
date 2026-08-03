"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, Listing, ApiError, photoUrl } from "@/lib/api";

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [photoBoxOpenFor, setPhotoBoxOpenFor] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleDelete(id: string, titre: string) {
    if (!token) return;
    if (!confirm(`Supprimer définitivement "${titre}" ?`)) return;
    setDeletingId(id);
    try {
      await api.deleteListing(id, token);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleUpload(id: string, files: FileList | null) {
    if (!token || !files || files.length === 0) return;
    setError(null);
    setUploadingFor(id);
    try {
      const updated = await api.uploadPhotos(id, Array.from(files), token);
      setListings((prev) => prev.map((l) => (l.id === id ? updated : l)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de l'envoi des photos");
    } finally {
      setUploadingFor(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeletePhoto(listingId: string, photoId: string) {
    if (!token) return;
    setError(null);
    setDeletingPhotoId(photoId);
    try {
      const updated = await api.deletePhoto(listingId, photoId, token);
      setListings((prev) => prev.map((l) => (l.id === listingId ? updated : l)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la suppression de la photo");
    } finally {
      setDeletingPhotoId(null);
    }
  }

  if (authLoading || !user) return null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">Mes annonces</h1>
        <Link
          href="/listings/new"
          className="self-start rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          + Nouvelle annonce
        </Link>
      </div>

      {loading && <p className="text-ink-muted">Chargement...</p>}
      {error && (
        <p className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {!loading && listings.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-ink-muted">Tu n&apos;as encore publié aucune annonce.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {listings.map((listing) => {
          const statut = STATUT_STYLES[listing.statut] ?? STATUT_STYLES.en_attente;
          const isDeleting = deletingId === listing.id;
          const isUploading = uploadingFor === listing.id;
          const photoBoxOpen = photoBoxOpenFor === listing.id;

          return (
            <div key={listing.id} className="rounded-xl border border-border bg-surface px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link href={`/listings/${listing.id}`} className="flex-1">
                  <p className="font-display font-semibold text-ink hover:underline">
                    {listing.titre}
                  </p>
                  <p className="text-sm text-ink-muted">
                    {Number(listing.prix).toFixed(0)}$/mois · {listing.adresse}
                  </p>
                </Link>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statut.className}`}
                  >
                    {statut.label}
                  </span>
                  <button
                    onClick={() =>
                      setPhotoBoxOpenFor(photoBoxOpen ? null : listing.id)
                    }
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-primary hover:text-primary"
                  >
                    Photos ({listing.photos?.length ?? 0})
                  </button>
                  <button
                    onClick={() => handleDelete(listing.id, listing.titre)}
                    disabled={isDeleting}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-50"
                  >
                    {isDeleting ? "..." : "Supprimer"}
                  </button>
                </div>
              </div>

              {photoBoxOpen && (
                <div className="mt-4 border-t border-border pt-4">
                  {listing.photos && listing.photos.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {listing.photos.map((p) => (
                        <div key={p.id} className="group relative h-20 w-20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photoUrl(p.url)}
                            alt=""
                            className="h-20 w-20 rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(listing.id, p.id)}
                            disabled={deletingPhotoId === p.id}
                            title="Retirer cette photo"
                            className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white shadow-sm transition-opacity hover:bg-danger disabled:opacity-50"
                          >
                            {deletingPhotoId === p.id ? (
                              "..."
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M18 6 6 18M6 6l12 12" />
                              </svg>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-ink">
                      Ajouter des photos (JPG, PNG ou WEBP)
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={isUploading}
                      onChange={(e) => handleUpload(listing.id, e.target.files)}
                      className="text-sm text-ink-muted file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary-dark"
                    />
                  </label>
                  {isUploading && (
                    <p className="mt-2 text-sm text-ink-muted">Envoi en cours...</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
