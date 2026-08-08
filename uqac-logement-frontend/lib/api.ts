const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body) headers["Content-Type"] = "application/json";
  if (options.token) headers["Authorization"] = `Bearer ${options.token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = data?.message ?? `Erreur ${res.status}`;
    throw new ApiError(res.status, Array.isArray(message) ? message.join(", ") : message);
  }

  return data as T;
}

export interface User {
  id: string;
  email: string;
  nom: string;
  languePref: string;
  roles: string[];
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface Listing {
  id: string;
  titre: string;
  description: string;
  prix: string;
  adresse: string;
  latitude: number;
  longitude: number;
  typeLogement: string;
  nbChambres: number;
  statut: string;
  photos: { id: string; url: string; ordre: number }[];
  owner: { id: string; nom: string; email: string };
  createdAt: string;
}

export const api = {
  register: (body: { email: string; password: string; nom: string }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body }),

  me: (token: string) => request<User>("/users/me", { token }),

  forgotPassword: (email: string) =>
    request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: { email },
    }),

  resetPassword: (token: string, newPassword: string) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: { token, newPassword },
    }),

  searchListings: (params: {
    prix_max?: number;
    prix_min?: number;
    type_logement?: string;
    nb_chambres_min?: number;
    distance_km?: number;
  }) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") query.set(key, String(value));
    });
    const qs = query.toString();
    return request<Listing[]>(`/listings${qs ? `?${qs}` : ""}`);
  },

  myListings: (token: string) => request<Listing[]>("/listings/mine", { token }),

  createListing: (
    body: {
      titre: string;
      description: string;
      prix: number;
      adresse: string;
      latitude: number;
      longitude: number;
      typeLogement: string;
      nbChambres: number;
    },
    token: string,
  ) => request<Listing>("/listings", { method: "POST", body, token }),

  getListing: (id: string) => request<Listing>(`/listings/${id}`),

  pendingListings: (token: string) =>
    request<Listing[]>("/listings/admin/pending", { token }),

  approveListing: (id: string, token: string) =>
    request<Listing>(`/listings/${id}/approve`, { method: "PATCH", token }),

  rejectListing: (id: string, token: string) =>
    request<Listing>(`/listings/${id}/reject`, { method: "PATCH", token }),

  deleteListing: (id: string, token: string) =>
    request<void>(`/listings/${id}`, { method: "DELETE", token }),

  // Upload de fichiers : différent des autres appels car on envoie du
  // multipart/form-data, pas du JSON — le navigateur doit fixer lui-même
  // l'en-tête Content-Type (avec la "boundary"), donc pas via request().
  async uploadPhotos(id: string, files: File[], token: string): Promise<Listing> {
    const formData = new FormData();
    files.forEach((file) => formData.append("photos", file));

    const res = await fetch(`${API_URL}/listings/${id}/photos`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const message = data?.message ?? `Erreur ${res.status}`;
      throw new ApiError(res.status, Array.isArray(message) ? message.join(", ") : message);
    }
    return data as Listing;
  },

  deletePhoto: (listingId: string, photoId: string, token: string) =>
    request<Listing>(`/listings/${listingId}/photos/${photoId}`, {
      method: "DELETE",
      token,
    }),
};

// ============ ROOMS ============
export interface Room {
  id: string;
  nom: string;
  prix: string;
  statut: "disponible" | "occupee";
  createdAt: string;
}

export const roomsApi = {
  listByListing: (listingId: string, token: string) =>
    request<Room[]>(`/listings/${listingId}/rooms`, { token }),

  create: (
    listingId: string,
    body: { nom: string; prix: number },
    token: string,
  ) => request<Room>(`/listings/${listingId}/rooms`, { method: "POST", body, token }),

  remove: (roomId: string, token: string) =>
    request<void>(`/rooms/${roomId}`, { method: "DELETE", token }),
};

// ============ TENANCIES ============
export interface Tenancy {
  id: string;
  tenant: { id: string; nom: string; email: string };
  room: Room;
  dateDebut: string;
  dateFin: string | null;
  loyerMensuel: string;
  jourEcheance: number;
  statut: "active" | "terminee";
}

export const tenanciesApi = {
  listByRoom: (roomId: string, token: string) =>
    request<Tenancy[]>(`/rooms/${roomId}/tenancies`, { token }),

  create: (
    roomId: string,
    body: {
      tenantEmail: string;
      dateDebut: string;
      loyerMensuel: number;
      jourEcheance?: number;
    },
    token: string,
  ) => request<Tenancy>(`/rooms/${roomId}/tenancies`, { method: "POST", body, token }),

  terminate: (tenancyId: string, token: string) =>
    request<Tenancy>(`/tenancies/${tenancyId}/terminate`, { method: "PATCH", token }),
};

// ============ PAYMENTS ============
export interface Payment {
  id: string;
  mois: string;
  montant: string;
  statut: "en_attente" | "paye" | "en_retard";
  methode: "interac" | "comptant" | null;
  datePaiement: string | null;
}

export interface PaymentSummaryRow {
  room: { id: string; nom: string };
  tenant: { id: string; nom: string; email: string } | null;
  payment: Payment | null;
}

export const paymentsApi = {
  summary: (listingId: string, mois: string, token: string) =>
    request<PaymentSummaryRow[]>(
      `/listings/${listingId}/payments/summary?mois=${mois}`,
      { token },
    ),

  markPaid: (
    paymentId: string,
    body: { methode: "interac" | "comptant" },
    token: string,
  ) => request<Payment>(`/payments/${paymentId}/pay`, { method: "PATCH", body, token }),
};

// ============ INTERESTS ============
export interface Interest {
  id: string;
  tenant: { id: string; nom: string; email: string };
  createdAt: string;
}

export const interestsApi = {
  markInterested: (listingId: string, token: string) =>
    request<Interest>(`/listings/${listingId}/interest`, { method: "POST", token }),

  listByListing: (listingId: string, token: string) =>
    request<Interest[]>(`/listings/${listingId}/interest`, { token }),
};

export { API_URL };

// Les photos sont stockées avec une URL relative (ex: /uploads/listings/x.jpg)
// qui pointe vers le BACKEND, pas le frontend — il faut donc préfixer avec
// l'adresse de l'API pour que <img src=...> fonctionne.
export function photoUrl(path: string): string {
  return `${API_URL}${path}`;
}
