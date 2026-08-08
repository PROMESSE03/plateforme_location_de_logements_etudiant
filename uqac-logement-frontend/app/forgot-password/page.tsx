"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-3xl font-semibold text-ink">
        Mot de passe oublié
      </h1>
      <p className="mt-2 text-ink-muted">
        Entre ton courriel et on t&apos;envoie un lien pour en choisir un
        nouveau.
      </p>

      {sent ? (
        <div className="mt-8 rounded-xl border border-success bg-success-bg p-5">
          <p className="text-sm font-medium text-success">
            Si un compte existe avec cet email, un lien de réinitialisation
            vient d&apos;être envoyé. Vérifie ta boîte de réception (et tes
            indésirables).
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Courriel</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@uqac.ca"
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-primary"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-primary px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {loading ? "Envoi..." : "Envoyer le lien"}
          </button>
        </form>
      )}

      <p className="mt-6 text-sm text-ink-muted">
        <Link href="/login" className="font-medium text-primary hover:underline">
          ← Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
