"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

export default function NewListingPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [adresse, setAdresse] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [typeLogement, setTypeLogement] = useState("chambre");
  const [nbChambres, setNbChambres] = useState("1");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.createListing(
        {
          titre,
          description,
          prix: Number(prix),
          adresse,
          latitude: Number(latitude),
          longitude: Number(longitude),
          typeLogement,
          nbChambres: Number(nbChambres),
        },
        token,
      );
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
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
            onClick={() => {
              setSuccess(false);
              setTitre("");
              setDescription("");
              setPrix("");
              setAdresse("");
              setLatitude("");
              setLongitude("");
              setNbChambres("1");
            }}
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

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Titre</span>
          <input
            required
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Chambre lumineuse proche UQAC"
            className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-primary"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Description</span>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-primary"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Prix / mois ($)</span>
            <input
              type="number"
              required
              min={0}
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-primary"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Type de logement</span>
            <select
              value={typeLogement}
              onChange={(e) => setTypeLogement(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-primary"
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
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            placeholder="123 rue Université, Chicoutimi"
            className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-primary"
          />
        </label>

        <div className="grid grid-cols-3 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Latitude</span>
            <input
              type="number"
              step="any"
              required
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="48.421"
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Longitude</span>
            <input
              type="number"
              step="any"
              required
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="-71.053"
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Nb. chambres</span>
            <input
              type="number"
              min={0}
              required
              value={nbChambres}
              onChange={(e) => setNbChambres(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-primary"
            />
          </label>
        </div>
        <p className="-mt-2 text-xs text-ink-muted">
          Astuce : trouve les coordonnées exactes de ton adresse sur Google
          Maps (clic droit sur le point → les chiffres copiés sont
          latitude, longitude).
        </p>

        {error && (
          <p className="rounded-lg bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 self-start rounded-full bg-primary px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {submitting ? "Publication..." : "Publier l'annonce"}
        </button>
      </form>
    </div>
  );
}
