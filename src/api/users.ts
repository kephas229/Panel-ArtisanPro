/**
 * users.ts
 * Gestion des utilisateurs — CRUD admin.
 *
 * Endpoints Django :
 *   GET    /api/admin/users/              → liste paginée
 *   GET    /api/admin/users/:id/          → détail
 *   PATCH  /api/admin/users/:id/          → mise à jour partielle
 *   POST   /api/admin/users/:id/ban/      → ban / unban
 */

import { api } from "./client";
import type { PaginatedResponse } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserAdmin {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  is_artisan: boolean;
  is_active: boolean;
  is_staff: boolean;
  phone_verified: boolean;
  created_at: string;
  demandes_count: number;
  signalements_recus: number;
  photo_url: string | null;
}

export interface UserAdminDetail extends UserAdmin {
  updated_at: string;
  ville: string | null;
  zone: string | null;
  profil_artisan: {
    id: number;
    description: string;
    is_verified: boolean;
    rating: number;
    demandes_realisees: number;
    demandes_en_cours: number;
  } | null;
  demandes_envoyees: number;
  demandes_recues: number;
}

export interface UsersListParams {
  search?: string;
  /** "artisan" | "client" | "admin" */
  role?: string;
  /** "active" | "inactive" */
  status?: string;
  page?: number;
  page_size?: number;
}

export interface BanPayload {
  action: "ban" | "unban";
}

export interface UserUpdatePayload {
  is_active?: boolean;
  is_staff?: boolean;
  email?: string;
  full_name?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildQuery(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== "") {
      qs.set(key, String(val));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Liste paginée des utilisateurs avec filtres optionnels.
 */
export async function listUsers(
  params: UsersListParams = {}
): Promise<PaginatedResponse<UserAdmin>> {
  const query = buildQuery(params as Record<string, unknown>);
  return api.get<PaginatedResponse<UserAdmin>>(`/admin/users/${query}`);
}

/**
 * Détails complets d'un utilisateur.
 */
export async function getUser(id: number): Promise<{ data: UserAdminDetail }> {
  return api.get<{ data: UserAdminDetail }>(`/admin/users/${id}/`);
}

/**
 * Mise à jour partielle (is_active, is_staff, email, full_name).
 */
export async function updateUser(
  id: number,
  payload: UserUpdatePayload
): Promise<{ data: UserAdminDetail; message: string }> {
  return api.patch<{ data: UserAdminDetail; message: string }>(
    `/admin/users/${id}/`,
    payload
  );
}

/**
 * Bannir ou débannir un utilisateur.
 */
export async function banUser(
  id: number,
  action: "ban" | "unban"
): Promise<{ data: UserAdminDetail; message: string }> {
  return api.post<{ data: UserAdminDetail; message: string }>(
    `/admin/users/${id}/ban/`,
    { action } satisfies BanPayload
  );
}
