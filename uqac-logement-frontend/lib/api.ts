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
};

export { API_URL };
