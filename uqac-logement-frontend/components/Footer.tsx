import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <p className="font-display text-lg font-semibold text-ink">
              UQAC Logement
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Fait pour les étudiants de l&apos;UQAC, par des gens du
              Saguenay.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Explorer
            </p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              <li>
                <Link href="/" className="text-ink-muted hover:text-ink">
                  Toutes les annonces
                </Link>
              </li>
              <li>
                <Link
                  href="/listings/new"
                  className="text-ink-muted hover:text-ink"
                >
                  Publier une annonce
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="text-ink-muted hover:text-ink">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Compte
            </p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              <li>
                <Link href="/login" className="text-ink-muted hover:text-ink">
                  Connexion
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-ink-muted hover:text-ink"
                >
                  S&apos;inscrire
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              À propos
            </p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              <li className="text-ink-muted">Chicoutimi, Saguenay</li>
              <li className="text-ink-muted">Projet étudiant</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-xs text-ink-muted">
          © {new Date().getFullYear()} UQAC Logement. Plateforme non
          affiliée à l&apos;Université du Québec à Chicoutimi.
        </div>
      </div>
    </footer>
  );
}
