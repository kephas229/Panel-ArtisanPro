/**
 * reports.ts
 * Gestion des signalements (modération admin).
 *
 * Endpoints Django :
 *   GET   /api/admin/reports/        → liste paginée
 *   GET   /api/admin/reports/:id/    → détail
 *   PATCH /api/admin/reports/:id/    → mise à jour du statut
 */

import { api } from "./client";
import type { PaginatedResponse } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SignalementStatut =
  | "ouvert"
  | "en_investigation"
  | "averti"
  | "resolu"
  | "ferme";

export type SignalementType = string; // défini dans les choices Django

export interface Signalement {
  id: number;
  type: SignalementType;
  raison: string;
  /** ID du ProfilArtisan signalé */
  artisan_signale: number;
  artisan_name: string;
  artisan_rating: number;
  /** ID de l'utilisateur qui a signalé */
  signale_par: number;
  reporter_name: string;
  reporter_phone: string;
  statut: SignalementStatut;
  created_at: string;
  updated_at: string;
}

export interface ReportsListParams {
  /** "ouvert" | "en_investigation" | "resolu" | "ferme" */
  status?: SignalementStatut;
  type?: string;
  page?: number;
  page_size?: number;
}

export interface UpdateSignalementPayload {
  statut: SignalementStatut;
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
 * Liste paginée des signalements avec filtres optionnels.
 */
export async function listReports(
  params: ReportsListParams = {}
): Promise<PaginatedResponse<Signalement>> {
  // Le backend utilise le query param "status" pour filtrer par statut
  const backendParams: Record<string, unknown> = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.type ? { type: params.type } : {}),
    ...(params.page ? { page: params.page } : {}),
    ...(params.page_size ? { page_size: params.page_size } : {}),
  };
  const query = buildQuery(backendParams);
  return api.get<PaginatedResponse<Signalement>>(`/admin/reports/${query}`);
}

/**
 * Détails complets d'un signalement.
 */
export async function getReport(id: number): Promise<{ data: Signalement }> {
  return api.get<{ data: Signalement }>(`/admin/reports/${id}/`);
}

/**
 * Met à jour le statut d'un signalement.
 * Statuts valides : ouvert | en_investigation | resolu | ferme
 */
export async function updateReportStatus(
  id: number,
  statut: SignalementStatut
): Promise<{ data: Signalement; message: string }> {
  return api.patch<{ data: Signalement; message: string }>(
    `/admin/reports/${id}/`,
    { statut } satisfies UpdateSignalementPayload
  );
}
