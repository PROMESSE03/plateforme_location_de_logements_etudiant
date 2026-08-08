"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-3xl font-semibold text-ink">
        Content de te revoir
      </h1>
      <p className="mt-2 text-ink-muted">
        Connecte-toi pour gérer tes annonces ou tes locations.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Courriel</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="toi@uqac.ca"
            className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none transition-colors focus:border-primary"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink">Mot de passe</span>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Oublié ?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none transition-colors focus:border-primary"
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
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-muted">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Inscris-toi
        </Link>
      </p>
    </div>
  );
}
