"use client";

import { useState } from "react";

const CONTACT_EMAIL = "contact@uqac-logement.ca";

export function ContactForm() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Pas de service d'envoi de courriel côté serveur pour l'instant : on
    // ouvre directement le client de messagerie de la personne (Gmail,
    // Outlook, etc.) avec le message pré-rempli.
    const subject = encodeURIComponent(`Message de ${nom} via UQAC Logement`);
    const body = encodeURIComponent(`${message}\n\n— ${nom} (${email})`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-success bg-success-bg p-6 text-center">
        <p className="font-medium text-success">
          Ton client de messagerie devrait s&apos;ouvrir avec le message
          prêt à envoyer.
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-3 text-sm font-medium text-success hover:underline"
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Ton nom</span>
          <input
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-primary"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Ton courriel</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-primary"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Message</span>
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="resize-none rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-primary"
        />
      </label>

      <button
        type="submit"
        className="mt-2 self-start rounded-full bg-primary px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-dark"
      >
        Envoyer le message
      </button>
    </form>
  );
}
