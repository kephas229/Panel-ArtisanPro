/**
 * INTEGRATION_EXAMPLES.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Exemples concrets pour connecter chaque page du back office à l'API.
 * Copie les blocs dont tu as besoin dans tes composants.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ══════════════════════════════════════════════════════════════════════════════
// 1. LOGIN.TSX — Connexion réelle
// ══════════════════════════════════════════════════════════════════════════════

/*
import { login } from "../api";

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  try {
    await login({ email: formData.email, password: formData.password });
    navigate("/");
  } catch (err: any) {
    setError(err.message ?? "Identifiants incorrects.");
  } finally {
    setLoading(false);
  }
};
*/

// ══════════════════════════════════════════════════════════════════════════════
// 2. DASHBOARD.TSX — Stats globales
// ══════════════════════════════════════════════════════════════════════════════

/*
import { useEffect, useState } from "react";
import { getGlobalStats, type GlobalStats } from "../api";

export function Dashboard() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGlobalStats()
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Chargement...</p>;
  if (!stats) return <p>Erreur de chargement.</p>;

  // Remplace les constantes mockées :
  const statCards = [
    { title: "Utilisateurs Total",  value: stats.total_users.toLocaleString() },
    { title: "Artisans vérifiés",   value: stats.artisans_verifies },
    { title: "Total Signalements",  value: stats.total_signalements },
    { title: "Demandes en attente", value: stats.demandes_en_attente },
  ];
  // ...
}
*/

// ══════════════════════════════════════════════════════════════════════════════
// 3. USERS.TSX — Liste + ban/unban
// ══════════════════════════════════════════════════════════════════════════════

/*
import { useEffect, useState } from "react";
import { listUsers, banUser, type UserAdmin } from "../api";

export function Users() {
  const [users, setUsers]     = useState<UserAdmin[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState("");
  const [role, setRole]       = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await listUsers({ search, role, page, page_size: 20 });
      setUsers(res.results);
      setTotal(res.count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, role, page]);

  const handleBan = async (userId: number, action: "ban" | "unban") => {
    try {
      await banUser(userId, action);
      fetchUsers(); // rafraîchit la liste
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Dans le JSX :
  // <button onClick={() => handleBan(user.id, user.is_active ? "ban" : "unban")}>
  //   {user.is_active ? "Bannir" : "Débannir"}
  // </button>
}
*/

// ══════════════════════════════════════════════════════════════════════════════
// 4. ARTISANREQUESTS.TSX — Liste + approuver/rejeter
// ══════════════════════════════════════════════════════════════════════════════

/*
import { useEffect, useState } from "react";
import {
  listArtisanRequests,
  approveArtisanRequest,
  rejectArtisanRequest,
  type ArtisanRequest,
  type ArtisanRequestStatus,
} from "../api";

export function ArtisanRequests() {
  const [requests, setRequests]     = useState<ArtisanRequest[]>([]);
  const [filterStatus, setFilter]   = useState<ArtisanRequestStatus>("pending");
  const [rejectReason, setReason]   = useState("");
  const [loading, setLoading]       = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await listArtisanRequests({ status: filterStatus });
      setRequests(res.results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [filterStatus]);

  const handleApprove = async (id: number) => {
    try {
      await approveArtisanRequest(id);
      fetchRequests();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (id: number, reason: string) => {
    try {
      await rejectArtisanRequest(id, reason);
      fetchRequests();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Mapping champs API → champs UI existants :
  //  api.user_name            → request.userName
  //  api.user_email           → request.email
  //  api.metiers[0]           → request.profession
  //  api.description          → request.description
  //  api.created_at           → request.submittedDate
  //  api.is_verified          → status "approved"
  //  api.demande_soumise=true → status "pending"
  //  api.photo_cip_url        → request.idPhotoUrl
  //  api.photo_diplome_url    → request.diplomaUrl
}
*/

// ══════════════════════════════════════════════════════════════════════════════
// 5. REPORTS.TSX — Liste + changer statut
// ══════════════════════════════════════════════════════════════════════════════

/*
import { useEffect, useState } from "react";
import {
  listReports,
  updateReportStatus,
  type Signalement,
  type SignalementStatut,
} from "../api";

export function Reports() {
  const [reports, setReports]     = useState<Signalement[]>([]);
  const [filterStatus, setFilter] = useState<SignalementStatut | "">("");
  const [loading, setLoading]     = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await listReports(
        filterStatus ? { status: filterStatus } : {}
      );
      setReports(res.results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [filterStatus]);

  const handleUpdateStatus = async (id: number, statut: SignalementStatut) => {
    try {
      await updateReportStatus(id, statut);
      fetchReports();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Mapping statuts API → statuts UI existants :
  //  "ouvert"           → "pending"
  //  "en_investigation" → "pending" (en cours de traitement)
  //  "resolu"           → "resolved"
  //  "ferme"            → "dismissed"

  // Boutons :
  //  Résoudre          → handleUpdateStatus(id, "resolu")
  //  Rejeter           → handleUpdateStatus(id, "ferme")
  //  En investigation  → handleUpdateStatus(id, "en_investigation")
  //  Suspendre artisan → banUser(artisanUserId, "ban") (depuis users.ts)
}
*/

// ══════════════════════════════════════════════════════════════════════════════
// 6. VARIABLES D'ENVIRONNEMENT
// ══════════════════════════════════════════════════════════════════════════════

/*
  Crée un fichier .env à la racine de ton projet front :

  VITE_API_URL=http://localhost:8000/api      ← dev local
  VITE_API_URL=https://api.artisanpro.bj/api  ← production

  Le client.ts lit automatiquement cette variable.
*/

export {}; // fichier purement documentaire
