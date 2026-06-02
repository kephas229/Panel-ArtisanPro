/**
 * referentiels.ts
 * Gestion des métiers, villes et zones - CRUD admin.
 */

import { api } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Metier {
  id: number;
  nom: string;
}

export interface Ville {
  id: number;
  nom: string;
}

export interface Zone {
  id: number;
  nom: string;
  ville: number; // ID de la ville
  ville_nom?: string; // Nom de la ville (read-only)
}

// ─── Métiers ──────────────────────────────────────────────────────────────────

export async function listMetiers(): Promise<Metier[]> {
  return api.get<Metier[]>(`/admin/metiers/`);
}

export async function getMetier(id: number): Promise<Metier> {
  return api.get<Metier>(`/admin/metiers/${id}/`);
}

export async function createMetier(data: { nom: string }): Promise<Metier> {
  return api.post<Metier>(`/admin/metiers/`, data);
}

export async function updateMetier(id: number, data: { nom: string }): Promise<Metier> {
  return api.patch<Metier>(`/admin/metiers/${id}/`, data);
}

export async function deleteMetier(id: number): Promise<void> {
  return api.delete<void>(`/admin/metiers/${id}/`);
}

// ─── Villes ───────────────────────────────────────────────────────────────────

export async function listVilles(): Promise<Ville[]> {
  return api.get<Ville[]>(`/admin/villes/`);
}

export async function getVille(id: number): Promise<Ville> {
  return api.get<Ville>(`/admin/villes/${id}/`);
}

export async function createVille(data: { nom: string }): Promise<Ville> {
  return api.post<Ville>(`/admin/villes/`, data);
}

export async function updateVille(id: number, data: { nom: string }): Promise<Ville> {
  return api.patch<Ville>(`/admin/villes/${id}/`, data);
}

export async function deleteVille(id: number): Promise<void> {
  return api.delete<void>(`/admin/villes/${id}/`);
}

// ─── Zones ────────────────────────────────────────────────────────────────────

export async function listZones(): Promise<Zone[]> {
  return api.get<Zone[]>(`/admin/zones/`);
}

export async function getZone(id: number): Promise<Zone> {
  return api.get<Zone>(`/admin/zones/${id}/`);
}

export async function createZone(data: { nom: string; ville: number }): Promise<Zone> {
  return api.post<Zone>(`/admin/zones/`, data);
}

export async function updateZone(id: number, data: { nom?: string; ville?: number }): Promise<Zone> {
  return api.patch<Zone>(`/admin/zones/${id}/`, data);
}

export async function deleteZone(id: number): Promise<void> {
  return api.delete<void>(`/admin/zones/${id}/`);
}
