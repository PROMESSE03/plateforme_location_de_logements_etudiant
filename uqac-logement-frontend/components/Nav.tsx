"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function NavLink({
  href,
  active,
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex items-center gap-1.5 transition-colors ${
        active ? "font-semibold text-primary" : "text-ink-muted hover:text-ink"
      }`}
    >
      {active && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
      )}
      {children}
    </Link>
  );
}

export function Nav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isBrowseActive =
    pathname === "/" ||
    (pathname.startsWith("/listings/") &&
      pathname !== "/listings/new" &&
      pathname !== "/listings/mine");

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-baseline gap-2" onClick={closeMobile}>
          <span className="font-display text-xl font-semibold tracking-tight text-ink">
            UQAC
          </span>
          <span className="text-sm font-medium text-ink-muted">Logement</span>
        </Link>

        {/* Menu complet — visible seulement à partir des écrans moyens (md) */}
        <nav className="hidden items-center gap-6 text-sm lg:flex">
          <NavLink href="/" active={isBrowseActive}>
            Annonces
          </NavLink>
          <NavLink href="/#carte" active={false}>
            Carte
          </NavLink>
          <NavLink href="/#contact" active={false}>
            Contact
          </NavLink>

          {user ? (
            <>
              <NavLink href="/listings/new" active={pathname === "/listings/new"}>
                Publier une annonce
              </NavLink>
              <NavLink href="/listings/mine" active={pathname === "/listings/mine"}>
                Mes annonces
              </NavLink>
              {user.roles.includes("ROLE_ADMIN") && (
                <NavLink href="/admin" active={pathname === "/admin"}>
                  Admin
                </NavLink>
              )}
              <div className="flex items-center gap-3 border-l border-border pl-6">
                <span className="text-ink-muted">{user.nom.split(" ")[0]}</span>
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
              <NavLink href="/login" active={pathname === "/login"}>
                Connexion
              </NavLink>
              <Link
                href="/register"
                className="rounded-full bg-primary px-4 py-1.5 font-medium text-white transition-colors hover:bg-primary-dark"
              >
                S&apos;inscrire
              </Link>
            </div>
          )}
        </nav>

        {/* Bouton hamburger — visible seulement sur petit écran */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink lg:hidden"
          aria-label="Ouvrir le menu"
        >
          {mobileOpen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          )}
        </button>
      </div>

      {/* Menu déroulant mobile */}
      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-border px-6 py-4 text-sm lg:hidden">
          <div className="py-2">
            <NavLink href="/" active={isBrowseActive} onClick={closeMobile}>
              Annonces
            </NavLink>
          </div>
          <div className="py-2">
            <NavLink href="/#carte" active={false} onClick={closeMobile}>
              Carte
            </NavLink>
          </div>
          <div className="py-2">
            <NavLink href="/#contact" active={false} onClick={closeMobile}>
              Contact
            </NavLink>
          </div>

          {user ? (
            <>
              <div className="py-2">
                <NavLink
                  href="/listings/new"
                  active={pathname === "/listings/new"}
                  onClick={closeMobile}
                >
                  Publier une annonce
                </NavLink>
              </div>
              <div className="py-2">
                <NavLink
                  href="/listings/mine"
                  active={pathname === "/listings/mine"}
                  onClick={closeMobile}
                >
                  Mes annonces
                </NavLink>
              </div>
              {user.roles.includes("ROLE_ADMIN") && (
                <div className="py-2">
                  <NavLink href="/admin" active={pathname === "/admin"} onClick={closeMobile}>
                    Admin
                  </NavLink>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between border-t border-border pt-4">
                <span className="text-ink-muted">{user.nom.split(" ")[0]}</span>
                <button
                  onClick={() => {
                    logout();
                    closeMobile();
                  }}
                  className="rounded-full border border-border px-3 py-1.5 text-ink"
                >
                  Déconnexion
                </button>
              </div>
            </>
          ) : (
            <div className="mt-2 flex flex-col gap-3 border-t border-border pt-4">
              <NavLink href="/login" active={pathname === "/login"} onClick={closeMobile}>
                Connexion
              </NavLink>
              <Link
                href="/register"
                onClick={closeMobile}
                className="self-start rounded-full bg-primary px-4 py-1.5 font-medium text-white"
              >
                S&apos;inscrire
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
