"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Lien invalide — le token est manquant.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="rounded-xl border border-danger bg-danger-bg p-5">
        <p className="text-sm font-medium text-danger">
          Ce lien est invalide. Redemande un lien de réinitialisation.
        </p>
        <Link
          href="/forgot-password"
          className="mt-3 inline-block text-sm font-medium text-danger hover:underline"
        >
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-xl border border-success bg-success-bg p-5">
        <p className="text-sm font-medium text-success">
          Mot de passe changé avec succès ! Redirection vers la connexion...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Nouveau mot de passe</span>
        <input
          type="password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="8 caractères minimum"
          className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-primary"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Confirme le mot de passe</span>
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
        {loading ? "Changement..." : "Changer le mot de passe"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-3xl font-semibold text-ink">
        Nouveau mot de passe
      </h1>
      <p className="mt-2 text-ink-muted">
        Choisis un nouveau mot de passe pour ton compte.
      </p>

      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-ink-muted">Chargement...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
