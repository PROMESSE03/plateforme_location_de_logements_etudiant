"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { geocodeAddress, GeocodeResult } from "@/lib/geocode";

export default function NewListingPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [adresse, setAdresse] = useState("");
  const [typeLogement, setTypeLogement] = useState("chambre");
  const [nbChambres, setNbChambres] = useState("1");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const [geocoded, setGeocoded] = useState<GeocodeResult | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  // Nettoyage des aperçus (URL.createObjectURL) pour éviter les fuites mémoire
  useEffect(() => {
    return () => photoPreviews.forEach((url) => URL.revokeObjectURL(url));
  }, [photoPreviews]);

  function handlePhotoChange(files: FileList | null) {
    if (!files) return;
    const fileArray = Array.from(files);
    setPhotos(fileArray);
    photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    setPhotoPreviews(fileArray.map((f) => URL.createObjectURL(f)));
  }

  // Étape 1 : on cherche l'adresse tapée pour trouver sa position exacte,
  // et on demande une confirmation avant de publier (l'utilisateur n'a
  // jamais à connaître latitude/longitude lui-même).
  async function handleVerifyAddress(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGeocoding(true);
    try {
      const result = await geocodeAddress(adresse);
      setGeocoded(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Adresse introuvable");
    } finally {
      setGeocoding(false);
    }
  }

  // Étape 2 : l'utilisateur confirme que l'adresse trouvée est la bonne.
  // On crée l'annonce, PUIS on envoie les photos si l'utilisateur en a
  // choisi (deux appels séparés côté serveur, mais un seul geste pour
  // l'utilisateur).
  async function handleConfirmPublish() {
    if (!token || !geocoded) return;
    setError(null);
    setSubmitting(true);
    try {
      const listing = await api.createListing(
        {
          titre,
          description,
          prix: Number(prix),
          adresse,
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
          typeLogement,
          nbChambres: Number(nbChambres),
        },
        token,
      );

      if (photos.length > 0) {
        await api.uploadPhotos(listing.id, photos, token);
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setSuccess(false);
    setTitre("");
    setDescription("");
    setPrix("");
    setAdresse("");
    setNbChambres("1");
    setGeocoded(null);
    photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    setPhotos([]);
    setPhotoPreviews([]);
  }

  if (authLoading || !user) return null;

  if (success) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Annonce envoyée pour validation
        </h1>
        <p className="mt-2 text-ink-muted">
          Un administrateur doit l&apos;approuver avant qu&apos;elle
          apparaisse dans les résultats de recherche publics.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => router.push("/listings/mine")}
            className="rounded-full bg-primary px-5 py-2.5 font-medium text-white hover:bg-primary-dark"
          >
            Voir mes annonces
          </button>
          <button
            onClick={resetForm}
            className="rounded-full border border-border px-5 py-2.5 font-medium text-ink hover:border-ink"
          >
            Publier une autre annonce
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">
        Publier une annonce
      </h1>
      <p className="mt-2 text-ink-muted">
        Ton annonce sera visible publiquement une fois approuvée par un
        administrateur.
      </p>

      <form onSubmit={handleVerifyAddress} className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Titre</span>
          <input
            required
            disabled={!!geocoded}
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Chambre lumineuse proche UQAC"
            className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-primary disabled:bg-paper disabled:text-ink-muted"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Description</span>
          <textarea
            required
            disabled={!!geocoded}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-primary disabled:bg-paper disabled:text-ink-muted"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Prix / mois ($)</span>
            <input
              type="number"
              required
              disabled={!!geocoded}
              min={0}
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-primary disabled:bg-paper disabled:text-ink-muted"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Type de logement</span>
            <select
              disabled={!!geocoded}
              value={typeLogement}
              onChange={(e) => setTypeLogement(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-primary disabled:bg-paper disabled:text-ink-muted"
            >
              <option value="chambre">Chambre</option>
              <option value="studio">Studio</option>
              <option value="appartement">Appartement</option>
              <option value="colocation">Colocation</option>
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Adresse</span>
          <input
            required
            disabled={!!geocoded}
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            placeholder="123 rue Université, Chicoutimi"
            className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-primary disabled:bg-paper disabled:text-ink-muted"
          />
          <span className="text-xs text-ink-muted">
            Pas besoin de coordonnées GPS — on les trouve automatiquement à
            partir de ton adresse.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Nb. chambres</span>
          <input
            type="number"
            min={0}
            required
            disabled={!!geocoded}
            value={nbChambres}
            onChange={(e) => setNbChambres(e.target.value)}
            className="w-32 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-primary disabled:bg-paper disabled:text-ink-muted"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">
            Photos (optionnel, tu peux en choisir plusieurs)
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={!!geocoded}
            onChange={(e) => handlePhotoChange(e.target.files)}
            className="text-sm text-ink-muted file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary-dark disabled:opacity-60"
          />
          {photoPreviews.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {photoPreviews.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ))}
            </div>
          )}
        </label>

        {error && (
          <p className="rounded-lg bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}

        {!geocoded && (
          <button
            type="submit"
            disabled={geocoding}
            className="mt-2 self-start rounded-full bg-primary px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {geocoding ? "Recherche de l'adresse..." : "Vérifier l'adresse"}
          </button>
        )}

        {geocoded && (
          <div className="rounded-xl border border-success bg-success-bg p-4">
            <p className="text-sm font-medium text-success">Adresse trouvée :</p>
            <p className="mt-1 text-sm text-ink">{geocoded.displayName}</p>
            <p className="mt-3 text-xs text-ink-muted">
              Données de localisation © contributeurs OpenStreetMap
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleConfirmPublish}
                disabled={submitting}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
              >
                {submitting
                  ? photos.length > 0
                    ? "Publication et envoi des photos..."
                    : "Publication..."
                  : "Oui, publier l'annonce"}
              </button>
              <button
                type="button"
                onClick={() => setGeocoded(null)}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-ink hover:border-ink"
              >
                Ce n&apos;est pas la bonne adresse
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
