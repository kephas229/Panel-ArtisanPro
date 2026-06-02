/**
 * avis.ts
 * Lecture des avis pour le dashboard admin (lecture seule).
 *
 * Endpoint Django :
 *   GET /api/avis/avis/          → liste paginée (public)
 *   GET /api/avis/avis/?artisan_id=X  → filtrée par artisan
 *
 * Format de réponse :
 *   { success: true, data: { results, count, next, previous } }
 */

import { api } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AvisClient {
  id: number;
  full_name: string;
  phone: string;
  photo_url: string | null;
}

export interface Avis {
  id: number;
  client: AvisClient;
  artisan_id: number;
  note: number;
  commentaire: string | null;
  created_at: string;
}

export interface AvisListParams {
  artisan_id?: number;
  page?: number;
  page_size?: number;
}

interface AvisListData {
  results: Avis[];
  count: number;
  next: string | null;
  previous: string | null;
}

// ─── API calls ────────────────────────────────────────────────────────────────

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

/**
 * Liste paginée des avis.
 * Retourne { data: { results, count, next, previous } }
 */
export async function listAvis(
  params: AvisListParams = {}
): Promise<{ data: AvisListData }> {
  const query = buildQuery(params as Record<string, unknown>);
  return api.get<{ data: AvisListData }>(`/avis/avis/${query}`);
}
