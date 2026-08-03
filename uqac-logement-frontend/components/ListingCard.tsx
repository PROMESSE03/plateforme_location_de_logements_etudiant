import Link from "next/link";
import { Listing, photoUrl } from "@/lib/api";
import { distanceFromUqacKm, formatDistance } from "@/lib/uqac";

const TYPE_LABELS: Record<string, string> = {
  chambre: "Chambre",
  appartement: "Appartement",
  studio: "Studio",
  colocation: "Colocation",
};

export function ListingCard({ listing }: { listing: Listing }) {
  const distance = distanceFromUqacKm(listing.latitude, listing.longitude);
  const photo = listing.photos?.[0];

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-surface transition-shadow hover:shadow-lg hover:shadow-ink/5"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-paper">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl(photo.url)}
            alt={listing.titre}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-muted/40">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5Z" />
            </svg>
          </div>
        )}

        {/* Signature : badge de distance UQAC, toujours visible sur chaque annonce */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/85 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
            <circle cx="12" cy="9.5" r="2.3" />
          </svg>
          {formatDistance(distance)}
        </div>
      </div>

      <div className="p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-semibold leading-snug text-ink">
            {listing.titre}
          </h3>
        </div>
        <p className="mb-3 text-sm text-ink-muted">
          {TYPE_LABELS[listing.typeLogement] ?? listing.typeLogement} ·{" "}
          {listing.nbChambres} {listing.nbChambres > 1 ? "chambres" : "chambre"}
        </p>
        <div className="flex items-baseline justify-between">
          <p className="font-display text-lg font-semibold text-ink">
            {Number(listing.prix).toFixed(0)}$
            <span className="text-sm font-normal text-ink-muted"> /mois</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
