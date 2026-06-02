/**
 * auth.ts
 * Authentification admin — login / logout / profil courant.
 *
 * Endpoint Django attendu (à adapter selon ton implémentation) :
 *   POST /api/auth/login/   → { token, user }
 */

import { api, setToken, clearToken } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  is_staff: boolean;
  is_active: boolean;
  created_at: string;
  photo_url: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AdminUser;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Connexion admin.
 * Stocke automatiquement le token et les infos admin dans localStorage.
 */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  // Le backend renvoie { data: { token, user }, message, success }
  const res = await api.post<{ data: LoginResponse; message: string }>(
    "/auth/login/",
    payload
  );

  const { token, user } = res.data;

  if (!user.is_staff) {
    throw new Error("Accès refusé : compte non administrateur.");
  }

  setToken(token);
  localStorage.setItem("currentAdmin", JSON.stringify(user));

  return { token, user };
}

/**
 * Déconnexion — efface le token local.
 * (Appelle /auth/logout/ si ton backend invalide les tokens côté serveur)
 */
export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout/");
  } catch {
    // Ignore l'erreur réseau — on déconnecte quand même côté client
  } finally {
    clearToken();
  }
}

/**
 * Récupère l'admin connecté depuis le localStorage (pas de requête réseau).
 * Utilise /auth/me/ si tu veux valider le token côté serveur.
 */
export function getCurrentAdmin(): AdminUser | null {
  const raw = localStorage.getItem("currentAdmin");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}
