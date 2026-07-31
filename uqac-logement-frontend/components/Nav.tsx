"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function Nav() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-xl font-semibold tracking-tight text-ink">
            UQAC
          </span>
          <span className="text-sm font-medium text-ink-muted">Logement</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="text-ink-muted transition-colors hover:text-ink">
            Annonces
          </Link>

          {user ? (
            <>
              <Link
                href="/listings/new"
                className="text-ink-muted transition-colors hover:text-ink"
              >
                Publier une annonce
              </Link>
              <Link
                href="/listings/mine"
                className="text-ink-muted transition-colors hover:text-ink"
              >
                Mes annonces
              </Link>
              {user.roles.includes("ROLE_ADMIN") && (
                <Link
                  href="/admin"
                  className="text-ink-muted transition-colors hover:text-ink"
                >
                  Admin
                </Link>
              )}
              <div className="flex items-center gap-3 border-l border-border pl-6">
                <span className="text-ink-muted">
                  {user.nom.split(" ")[0]}
                </span>
                <button
                  onClick={logout}
                  className="rounded-full border border-border px-3 py-1.5 text-ink transition-colors hover:border-ink"
                >
                  Déconnexion
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-ink-muted transition-colors hover:text-ink"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-primary px-4 py-1.5 font-medium text-white transition-colors hover:bg-primary-dark"
              >
                S&apos;inscrire
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
