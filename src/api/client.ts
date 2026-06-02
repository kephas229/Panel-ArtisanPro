/**
 * client.ts
 * Base HTTP client — gère le token, les erreurs, la pagination.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

// ─── Types utilitaires ────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Helpers token ────────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem("adminToken");
}

export function setToken(token: string): void {
  localStorage.setItem("adminToken", token);
}

export function clearToken(): void {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("currentAdmin");
}

// ─── Client de base ───────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // 401 → déconnexion automatique
  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new Error("Session expirée. Veuillez vous reconnecter.");
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  const json = await res.json();

  if (!res.ok) {
    const msg =
      json?.message ?? json?.detail ?? `Erreur ${res.status}`;
    const err = new Error(msg) as Error & {
      errors?: Record<string, string[]>;
      status: number;
    };
    err.errors = json?.errors;
    err.status = res.status;
    throw err;
  }

  return json as T;
}

// ─── Méthodes HTTP ────────────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string) =>
    request<T>(path, { method: "GET" }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),

  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),
};
