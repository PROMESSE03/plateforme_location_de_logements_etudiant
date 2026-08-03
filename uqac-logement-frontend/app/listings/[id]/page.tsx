"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, Listing, ApiError, photoUrl } from "@/lib/api";
import { distanceFromUqacKm, formatDistance } from "@/lib/uqac";

const TYPE_LABELS: Record<string, string> = {
  chambre: "Chambre",
  appartement: "Appartement",
  studio: "Studio",
  colocation: "Colocation",
};

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getListing(params.id)
      .then(setListing)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setError("Cette annonce n'existe pas ou n'est pas encore approuvée.");
        } else {
          setError("Impossible de charger cette annonce.");
        }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <p className="mx-auto max-w-4xl px-6 py-16 text-ink-muted">Chargement...</p>;
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-ink-muted">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 rounded-full bg-primary px-5 py-2.5 font-medium text-white hover:bg-primary-dark"
        >
          Retour aux annonces
        </button>
      </div>
    );
  }

  const distance = distanceFromUqacKm(listing.latitude, listing.longitude);
  const photos = listing.photos ?? [];
  const currentPhoto = photos[activePhoto];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/" className="text-sm text-ink-muted hover:text-ink">
        ← Retour aux annonces
      </Link>

      {/* Galerie de photos */}
      <div className="mt-4">
        <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl bg-paper">
          {currentPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl(currentPhoto.url)}
              alt={listing.titre}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-muted/40">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5Z" />
              </svg>
            </div>
          )}
        </div>

        {photos.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {photos.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setActivePhoto(i)}
                className={`h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                  i === activePhoto ? "border-primary" : "border-transparent"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl(p.url)} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Infos principales */}
      <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-1 text-xs font-medium text-ink">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
              <circle cx="12" cy="9.5" r="2.3" />
            </svg>
            {formatDistance(distance)}
          </div>
          <h1 className="font-display text-3xl font-semibold text-ink">{listing.titre}</h1>
          <p className="mt-1 text-ink-muted">{listing.adresse}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="font-display text-3xl font-semibold text-ink">
            {Number(listing.prix).toFixed(0)}$
            <span className="text-base font-normal text-ink-muted"> /mois</span>
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {TYPE_LABELS[listing.typeLogement] ?? listing.typeLogement} ·{" "}
            {listing.nbChambres} {listing.nbChambres > 1 ? "chambres" : "chambre"}
          </p>
        </div>
      </div>

      <hr className="my-8 border-border" />

      {/* Description */}
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Description</h2>
        <p className="mt-2 whitespace-pre-line text-ink-muted">{listing.description}</p>
      </div>

      <hr className="my-8 border-border" />

      {/* Contact propriétaire */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Propriétaire</h2>
        <p className="mt-1 text-ink-muted">{listing.owner.nom}</p>
        <a
          href={`mailto:${listing.owner.email}?subject=${encodeURIComponent(
            "Intéressé(e) par : " + listing.titre,
          )}`}
          className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary-dark"
        >
          Contacter par courriel
        </a>
        <p className="mt-2 text-xs text-ink-muted">
          La messagerie intégrée arrive bientôt — pour l&apos;instant, un
          courriel direct.
        </p>
      </div>
    </div>
  );
}
