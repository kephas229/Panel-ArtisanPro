/**
 * stats.ts
 * Statistiques globales et par artisan pour le dashboard admin.
 *
 * Endpoints Django :
 *   GET /api/admin/stats/global/              → stats plateforme
 *   GET /api/admin/stats/artisan/:artisanId/  → stats d'un artisan
 */

import { api } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GlobalStats {
  total_users: number;
  total_artisans: number;
  total_demandes: number;
  demandes_en_attente: number;
  demandes_acceptees: number;
  demandes_terminees: number;
  total_avis: number;
  total_signalements: number;
  signalements_ouverts: number;
  artisans_verifies: number;
  artisans_non_verifies: number;
}

export interface ArtisanStats {
  artisan_id: number;
  artisan_name: string;
  demandes_en_attente: number;
  demandes_en_cours: number;
  demandes_terminees: number;
  demandes_refusees: number;
  demandes_annulees: number;
  rating: number;
  demandes_realisees: number;
  avis_count: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Statistiques globales de la plateforme.
 * Utilisé par Dashboard.tsx pour remplir les cards et les graphiques.
 */
export async function getGlobalStats(): Promise<{ data: GlobalStats }> {
  return api.get<{ data: GlobalStats }>("/admin/stats/global/");
}

/**
 * Statistiques détaillées pour un artisan spécifique.
 * Utilisé pour la vue détail artisan ou des tableaux analytiques.
 */
export async function getArtisanStats(
  artisanId: number
): Promise<{ data: ArtisanStats }> {
  return api.get<{ data: ArtisanStats }>(`/admin/stats/artisan/${artisanId}/`);
}
