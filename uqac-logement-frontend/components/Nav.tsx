"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function Icon({ path }: { path: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  listings: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-9.500Z",
  contact: "M3 6.500A1.500 1.500 0 0 1 4.500 5h15A1.500 1.500 0 0 1 21 6.500v11a1.500 1.500 0 0 1-1.500 1.500h-15A1.500 1.500 0 0 1 3 17.500v-11ZM3.500 6.500 12 13l8.500-6.500",
  publish: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8v8M8 12h8",
  mine: "M9 6h11M9 12h11M9 18h11M4 6h.010M4 12h.010M4 18h.010",
  admin: "M12 3 5 6v5.500c0 4.400 3 7.900 7 9.500 4-1.600 7-5.100 7-9.500V6l-7-3ZM9 12l2 2 4-4",
  login: "M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 8l4 4-4 4M14 12H4",
  logout: "M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M16 8l4 4-4 4M20 12H10",
  register: "M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM3 20c0-3.300 3.100-5.500 7-5.500s7 2.200 7 5.500M19 8v6M16 11h6",
};

function NavLink({
  href,
  active,
  icon,
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  icon: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 font-medium transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-ink hover:bg-paper hover:text-primary"
      }`}
    >
      <Icon path={icon} />
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
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex shrink-0 items-baseline gap-2" onClick={closeMobile}>
          <span className="font-display text-xl font-semibold tracking-tight text-ink">
            UQAC
          </span>
          <span className="text-sm font-medium text-ink-muted">Logement</span>
        </Link>

        {/* Menu complet — visible seulement à partir des grands écrans (lg) */}
        <nav className="hidden items-center gap-1 whitespace-nowrap text-sm lg:flex">
          <NavLink href="/" active={isBrowseActive} icon={ICONS.listings}>
            Annonces
          </NavLink>
          <NavLink href="/#contact" active={false} icon={ICONS.contact}>
            Contact
          </NavLink>

          {user ? (
            <>
              <NavLink href="/listings/new" active={pathname === "/listings/new"} icon={ICONS.publish}>
                Publier une annonce
              </NavLink>
              <NavLink href="/listings/mine" active={pathname === "/listings/mine"} icon={ICONS.mine}>
                Mes annonces
              </NavLink>
              {user.roles.includes("ROLE_ADMIN") && (
                <NavLink href="/admin" active={pathname === "/admin"} icon={ICONS.admin}>
                  Admin
                </NavLink>
              )}
              <div className="ml-2 flex items-center gap-3 border-l border-border pl-4">
                <span className="text-ink-muted">{user.nom.split(" ")[0]}</span>
                <button
                  onClick={logout}
                  aria-label="Déconnexion"
                  title="Déconnexion"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink transition-colors hover:border-ink"
                >
                  <Icon path={ICONS.logout} />
                </button>
              </div>
            </>
          ) : (
            <div className="ml-2 flex items-center gap-2">
              <NavLink href="/login" active={pathname === "/login"} icon={ICONS.login}>
                Connexion
              </NavLink>
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary-dark"
              >
                <Icon path={ICONS.register} />
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
        <nav className="flex flex-col gap-1 border-t border-border px-4 py-3 text-base lg:hidden">
          <NavLink href="/" active={isBrowseActive} icon={ICONS.listings} onClick={closeMobile}>
            Annonces
          </NavLink>
          <NavLink href="/#contact" active={false} icon={ICONS.contact} onClick={closeMobile}>
            Contact
          </NavLink>

          {user ? (
            <>
              <NavLink
                href="/listings/new"
                active={pathname === "/listings/new"}
                icon={ICONS.publish}
                onClick={closeMobile}
              >
                Publier une annonce
              </NavLink>
              <NavLink
                href="/listings/mine"
                active={pathname === "/listings/mine"}
                icon={ICONS.mine}
                onClick={closeMobile}
              >
                Mes annonces
              </NavLink>
              {user.roles.includes("ROLE_ADMIN") && (
                <NavLink
                  href="/admin"
                  active={pathname === "/admin"}
                  icon={ICONS.admin}
                  onClick={closeMobile}
                >
                  Admin
                </NavLink>
              )}
              <div className="mt-2 flex items-center justify-between border-t border-border px-3 pt-3">
                <span className="text-ink-muted">{user.nom.split(" ")[0]}</span>
                <button
                  onClick={() => {
                    logout();
                    closeMobile();
                  }}
                  className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-ink"
                >
                  <Icon path={ICONS.logout} />
                  Déconnexion
                </button>
              </div>
            </>
          ) : (
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              <NavLink
                href="/login"
                active={pathname === "/login"}
                icon={ICONS.login}
                onClick={closeMobile}
              >
                Connexion
              </NavLink>
              <Link
                href="/register"
                onClick={closeMobile}
                className="flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 font-medium text-white"
              >
                <Icon path={ICONS.register} />
                S&apos;inscrire
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
