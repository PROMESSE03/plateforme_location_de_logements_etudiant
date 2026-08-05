"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  api,
  roomsApi,
  tenanciesApi,
  paymentsApi,
  Room,
  PaymentSummaryRow,
  ApiError,
} from "@/lib/api";

const ROOM_STATUT_STYLES: Record<string, { label: string; className: string }> = {
  disponible: { label: "Disponible", className: "bg-success-bg text-success" },
  occupee: { label: "Occupée", className: "bg-warning-bg text-warning" },
};

const PAYMENT_STATUT_STYLES: Record<string, { label: string; className: string }> = {
  en_attente: { label: "En attente", className: "bg-warning-bg text-warning" },
  paye: { label: "Payé", className: "bg-success-bg text-success" },
  en_retard: { label: "En retard", className: "bg-danger-bg text-danger" },
};

function currentMonthInputValue(): string {
  return new Date().toISOString().slice(0, 7); // "YYYY-MM"
}

function monthInputToApiMonth(value: string): string {
  return `${value}-01`; // "YYYY-MM" -> "YYYY-MM-01"
}

export default function ManageListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const listingId = params.id;

  const [listingTitre, setListingTitre] = useState<string>("");

  // Chambres
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [newRoomNom, setNewRoomNom] = useState("");
  const [newRoomPrix, setNewRoomPrix] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);

  // Louer une chambre (formulaire inline)
  const [rentingRoomId, setRentingRoomId] = useState<string | null>(null);
  const [tenantEmail, setTenantEmail] = useState("");
  const [dateDebut, setDateDebut] = useState(() => new Date().toISOString().slice(0, 10));
  const [loyerMensuel, setLoyerMensuel] = useState("");
  const [jourEcheance, setJourEcheance] = useState("1");
  const [rentingSubmitting, setRentingSubmitting] = useState(false);
  const [rentingError, setRentingError] = useState<string | null>(null);

  // Suivi des paiements
  const [summaryMonth, setSummaryMonth] = useState(currentMonthInputValue());
  const [summaryRows, setSummaryRows] = useState<PaymentSummaryRow[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    if (!token) return;
    setLoadingRooms(true);
    try {
      const data = await roomsApi.listByListing(listingId, token);
      setRooms(data);
    } catch (err) {
      setRoomsError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoadingRooms(false);
    }
  }, [listingId, token]);

  const fetchSummary = useCallback(async () => {
    if (!token) return;
    setLoadingSummary(true);
    setSummaryError(null);
    try {
      const data = await paymentsApi.summary(
        listingId,
        monthInputToApiMonth(summaryMonth),
        token,
      );
      setSummaryRows(data);
    } catch (err) {
      setSummaryError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoadingSummary(false);
    }
  }, [listingId, summaryMonth, token]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (token) {
      api
        .getListing(listingId)
        .then((l) => setListingTitre(l.titre))
        .catch(() => {
          api.myListings(token).then((mine) => {
            const found = mine.find((l) => l.id === listingId);
            if (found) setListingTitre(found.titre);
          });
        });
      fetchRooms();
    }
  }, [authLoading, user, token, listingId, fetchRooms]);

  useEffect(() => {
    if (token) fetchSummary();
  }, [fetchSummary, token]);

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setCreatingRoom(true);
    setRoomsError(null);
    try {
      await roomsApi.create(
        listingId,
        { nom: newRoomNom, prix: Number(newRoomPrix) },
        token,
      );
      setNewRoomNom("");
      setNewRoomPrix("");
      await fetchRooms();
    } catch (err) {
      setRoomsError(err instanceof ApiError ? err.message : "Erreur lors de la création");
    } finally {
      setCreatingRoom(false);
    }
  }

  async function handleDeleteRoom(roomId: string, nom: string) {
    if (!token) return;
    if (!confirm(`Supprimer la chambre "${nom}" ? Cette action est irréversible.`)) return;
    try {
      await roomsApi.remove(roomId, token);
      await fetchRooms();
    } catch (err) {
      setRoomsError(err instanceof ApiError ? err.message : "Erreur lors de la suppression");
    }
  }

  function openRentForm(room: Room) {
    setRentingRoomId(room.id);
    setLoyerMensuel(room.prix);
    setTenantEmail("");
    setDateDebut(new Date().toISOString().slice(0, 10));
    setJourEcheance("1");
    setRentingError(null);
  }

  async function handleCreateTenancy(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !rentingRoomId) return;
    setRentingSubmitting(true);
    setRentingError(null);
    try {
      await tenanciesApi.create(
        rentingRoomId,
        {
          tenantEmail,
          dateDebut,
          loyerMensuel: Number(loyerMensuel),
          jourEcheance: Number(jourEcheance),
        },
        token,
      );
      setRentingRoomId(null);
      await fetchRooms();
      await fetchSummary();
    } catch (err) {
      setRentingError(err instanceof ApiError ? err.message : "Erreur lors de la location");
    } finally {
      setRentingSubmitting(false);
    }
  }

  async function handleMarkPaid(paymentId: string, methode: "interac" | "comptant") {
    if (!token) return;
    setMarkingPaidId(paymentId);
    try {
      await paymentsApi.markPaid(paymentId, { methode }, token);
      await fetchSummary();
    } catch (err) {
      setSummaryError(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setMarkingPaidId(null);
    }
  }

  if (authLoading || !user) return null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/listings/mine" className="text-sm text-ink-muted hover:text-ink">
        ← Mes annonces
      </Link>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
        Gérer : {listingTitre || "..."}
      </h1>

      {/* ============ CHAMBRES ============ */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink">Chambres</h2>

        {roomsError && (
          <p className="mt-3 rounded-lg bg-danger-bg px-4 py-3 text-sm text-danger">
            {roomsError}
          </p>
        )}

        {loadingRooms && <p className="mt-3 text-sm text-ink-muted">Chargement...</p>}

        {!loadingRooms && rooms.length === 0 && (
          <p className="mt-3 text-sm text-ink-muted">
            Aucune chambre pour l&apos;instant — ajoute-en une ci-dessous.
          </p>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {rooms.map((room) => {
            const statut = ROOM_STATUT_STYLES[room.statut];
            return (
              <div key={room.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-ink">{room.nom}</p>
                    <p className="text-sm text-ink-muted">
                      {Number(room.prix).toFixed(0)}$/mois
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${statut.className}`}>
                      {statut.label}
                    </span>
                    {room.statut === "disponible" && (
                      <button
                        onClick={() => openRentForm(room)}
                        className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark"
                      >
                        Louer
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteRoom(room.id, room.nom)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-muted hover:border-danger hover:text-danger"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                {rentingRoomId === room.id && (
                  <form
                    onSubmit={handleCreateTenancy}
                    className="mt-4 flex flex-col gap-3 border-t border-border pt-4"
                  >
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-ink">
                        Email du locataire (doit déjà avoir un compte)
                      </span>
                      <input
                        type="email"
                        required
                        value={tenantEmail}
                        onChange={(e) => setTenantEmail(e.target.value)}
                        placeholder="locataire@uqac.ca"
                        className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
                      />
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <label className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-ink">Date de début</span>
                        <input
                          type="date"
                          required
                          value={dateDebut}
                          onChange={(e) => setDateDebut(e.target.value)}
                          className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-ink">Loyer mensuel ($)</span>
                        <input
                          type="number"
                          required
                          min={0}
                          value={loyerMensuel}
                          onChange={(e) => setLoyerMensuel(e.target.value)}
                          className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-ink">Jour d&apos;échéance</span>
                        <input
                          type="number"
                          required
                          min={1}
                          max={28}
                          value={jourEcheance}
                          onChange={(e) => setJourEcheance(e.target.value)}
                          className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
                        />
                      </label>
                    </div>

                    {rentingError && (
                      <p className="rounded-lg bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
                        {rentingError}
                      </p>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={rentingSubmitting}
                        className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
                      >
                        {rentingSubmitting ? "..." : "Confirmer la location"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRentingRoomId(null)}
                        className="rounded-full border border-border px-5 py-2 text-sm font-medium text-ink"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>

        {/* Ajouter une chambre */}
        <form
          onSubmit={handleCreateRoom}
          className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-border p-4"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Nom de la chambre
            </span>
            <input
              required
              value={newRoomNom}
              onChange={(e) => setNewRoomNom(e.target.value)}
              placeholder="Chambre 1"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Prix / mois
            </span>
            <input
              type="number"
              required
              min={0}
              value={newRoomPrix}
              onChange={(e) => setNewRoomPrix(e.target.value)}
              placeholder="450"
              className="w-28 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
          </label>
          <button
            type="submit"
            disabled={creatingRoom}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {creatingRoom ? "..." : "+ Ajouter une chambre"}
          </button>
        </form>
      </section>

      {/* ============ SUIVI DES PAIEMENTS ============ */}
      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            Suivi des paiements
          </h2>
          <label className="flex items-center gap-2">
            <span className="text-sm text-ink-muted">Mois :</span>
            <input
              type="month"
              value={summaryMonth}
              onChange={(e) => setSummaryMonth(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
            />
          </label>
        </div>

        {summaryError && (
          <p className="mt-3 rounded-lg bg-danger-bg px-4 py-3 text-sm text-danger">
            {summaryError}
          </p>
        )}
        {loadingSummary && <p className="mt-3 text-sm text-ink-muted">Chargement...</p>}

        {!loadingSummary && summaryRows.length === 0 && (
          <p className="mt-3 text-sm text-ink-muted">Aucune chambre à afficher.</p>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {summaryRows.map((row) => {
            const paymentStatut = row.payment
              ? PAYMENT_STATUT_STYLES[row.payment.statut]
              : null;
            const isMarking = row.payment && markingPaidId === row.payment.id;
            return (
              <div
                key={row.room.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-ink">{row.room.nom}</p>
                  <p className="text-sm text-ink-muted">
                    {row.tenant ? row.tenant.nom : "Vacante"}
                  </p>
                </div>

                {row.payment ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-ink">
                      {Number(row.payment.montant).toFixed(0)}$
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${paymentStatut?.className}`}
                    >
                      {paymentStatut?.label}
                    </span>
                    {row.payment.statut !== "paye" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMarkPaid(row.payment!.id, "interac")}
                          disabled={!!isMarking}
                          className="rounded-full bg-success px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                        >
                          {isMarking ? "..." : "Payé (Interac)"}
                        </button>
                        <button
                          onClick={() => handleMarkPaid(row.payment!.id, "comptant")}
                          disabled={!!isMarking}
                          className="rounded-full bg-success px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                        >
                          {isMarking ? "..." : "Payé (comptant)"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-ink-muted">—</span>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
