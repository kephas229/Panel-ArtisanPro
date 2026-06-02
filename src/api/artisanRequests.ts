/**
 * artisanRequests.ts
 * Candidatures artisans — liste, détail, approbation, rejet.
 *
 * Endpoints Django :
 *   GET   /api/admin/artisan-requests/                    → liste paginée
 *   GET   /api/admin/artisan-requests/:id/                → détail
 *   POST  /api/admin/artisan-requests/:id/approve/        → approuver
 *   POST  /api/admin/artisan-requests/:id/reject/         → rejeter
 */

import { api } from "./client";
import type { PaginatedResponse } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ArtisanRequest {
  id: number;
  user_name: string;
  user_phone: string;
  user_email: string;
  description: string;
  /** Liste des métiers (StringRelatedField → noms) */
  metiers: string[];
  is_verified: boolean;
  photo_cip_url: string | null;
  photo_diplome_url: string | null;
  demande_verification_soumise: boolean;
  created_at: string;
  updated_at: string;
}

export type ArtisanRequestStatus =
  | "pending"       // is_verified=false & demande_soumise=true
  | "verified"      // is_verified=true
  | "not_submitted" // demande_soumise=false

export interface ArtisanRequestsListParams {
  status?: ArtisanRequestStatus;
  page?: number;
  page_size?: number;
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
 * Liste paginée des candidatures.
 * Par défaut retourne les candidatures en attente (status=pending).
 */
export async function listArtisanRequests(
  params: ArtisanRequestsListParams = { status: "pending" }
): Promise<PaginatedResponse<ArtisanRequest>> {
  const query = buildQuery(params as Record<string, unknown>);
  return api.get<PaginatedResponse<ArtisanRequest>>(
    `/admin/artisan-requests/${query}`
  );
}

/**
 * Détails complets d'une candidature.
 */
export async function getArtisanRequest(
  id: number
): Promise<{ data: ArtisanRequest }> {
  return api.get<{ data: ArtisanRequest }>(`/admin/artisan-requests/${id}/`);
}

/**
 * Approuver la vérification d'un artisan.
 * Déclenche une notification côté backend.
 */
export async function approveArtisanRequest(
  artisanId: number
): Promise<{ data: ArtisanRequest; message: string }> {
  return api.post<{ data: ArtisanRequest; message: string }>(
    `/admin/artisan-requests/${artisanId}/approve/`
  );
}

/**
 * Rejeter la vérification d'un artisan.
 * @param reason Motif du rejet (affiché dans la notification envoyée à l'artisan)
 */
export async function rejectArtisanRequest(
  artisanId: number,
  reason: string
): Promise<{ data: ArtisanRequest; message: string }> {
  return api.post<{ data: ArtisanRequest; message: string }>(
    `/admin/artisan-requests/${artisanId}/reject/`,
    { reason }
  );
}
