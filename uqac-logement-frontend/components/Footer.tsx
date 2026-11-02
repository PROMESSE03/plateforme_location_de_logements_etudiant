import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-primary-dark">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <p className="font-display text-lg font-semibold text-white">
              UQAC Logement
            </p>
            <p className="mt-2 text-sm text-white/75">
              Fait pour les étudiants de l&apos;UQAC, par des gens du
              Saguenay.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white">
              Explorer
            </p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              <li>
                <Link href="/" className="text-white/75 hover:text-white">
                  Toutes les annonces
                </Link>
              </li>
              <li>
                <Link
                  href="/listings/new"
                  className="text-white/75 hover:text-white"
                >
                  Publier une annonce
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="text-white/75 hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white">
              Compte
            </p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              <li>
                <Link href="/login" className="text-white/75 hover:text-white">
                  Connexion
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-white/75 hover:text-white"
                >
                  S&apos;inscrire
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white">
              À propos
            </p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              <li className="text-white/75">Chicoutimi, Saguenay</li>
              <li className="text-white/75">Projet étudiant</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/15 pt-6 text-xs text-white/75">
          © {new Date().getFullYear()} UQAC Logement. Plateforme non
          affiliée à l&apos;Université du Québec à Chicoutimi.
        </div>
      </div>
    </footer>
  );
}
