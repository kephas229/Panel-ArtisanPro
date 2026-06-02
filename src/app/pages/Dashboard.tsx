import { useEffect, useState } from "react";
import { Users, UserCheck, Star, Flag, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { getGlobalStats, type GlobalStats } from "../../api/stats";

// ── Composant carte stat ──────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  sub: string;
  trend: "up" | "down" | "neutral";
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, sub, trend, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`flex items-center gap-1 text-sm ${
          trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-500"
        }`}>
          {trend === "up"   && <TrendingUp   className="w-4 h-4" />}
          {trend === "down" && <TrendingDown className="w-4 h-4" />}
          <span className="font-medium">{sub}</span>
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">
        {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
      </h3>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  );
}

// ── Page Dashboard ────────────────────────────────────────────────────────────

export function Dashboard() {
  const [stats, setStats]     = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getGlobalStats();
      setStats(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  // ── Graphiques (données dérivées des stats réelles) ───────────────────────
  const demandesData = stats
    ? [
        { label: "En attente", value: stats.demandes_en_attente,  fill: "#f59e0b" },
        { label: "Acceptées",  value: stats.demandes_acceptees,   fill: "#3b82f6" },
        { label: "Terminées",  value: stats.demandes_terminees,   fill: "#10b981" },
      ]
    : [];

  const artisansData = stats
    ? [
        { label: "Vérifiés",     value: stats.artisans_verifies,     fill: "#8b5cf6" },
        { label: "Non vérifiés", value: stats.artisans_non_verifies, fill: "#e5e7eb" },
      ]
    : [];

  // ── Rendu ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 mb-4">{error ?? "Impossible de charger les statistiques."}</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const statCards: StatCardProps[] = [
    {
      title: "Utilisateurs total",
      value: stats.total_users,
      sub:   `dont ${stats.total_artisans} artisans`,
      trend: "up",
      icon:  Users,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Artisans vérifiés",
      value: stats.artisans_verifies,
      sub:   `${stats.artisans_non_verifies} en attente`,
      trend: stats.artisans_non_verifies > 0 ? "up" : "neutral",
      icon:  UserCheck,
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Total avis",
      value: stats.total_avis,
      sub:   `${stats.demandes_terminees} demandes terminées`,
      trend: "up",
      icon:  Star,
      color: "from-amber-500 to-amber-600",
    },
    {
      title: "Signalements ouverts",
      value: stats.signalements_ouverts,
      sub:   `${stats.total_signalements} au total`,
      trend: stats.signalements_ouverts > 0 ? "down" : "neutral",
      icon:  Flag,
      color: "from-red-500 to-red-600",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
          <p className="text-gray-600 mt-1">Bienvenue sur votre back office ArtisanPro</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Demandes par statut */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Demandes par statut</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={demandesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" stroke="#6b7280" tick={{ fontSize: 12 }} />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="value" name="Demandes" radius={[8, 8, 0, 0]}>
                {demandesData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Artisans vérifiés vs non vérifiés */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Artisans — vérification</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={artisansData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" stroke="#6b7280" tick={{ fontSize: 12 }} />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="value" name="Artisans" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Résumé chiffres clés */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé de la plateforme</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Total demandes",    value: stats.total_demandes },
            { label: "Demandes en cours", value: stats.demandes_acceptees },
            { label: "Total avis",        value: stats.total_avis },
            { label: "Signalements",      value: stats.total_signalements },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold text-gray-900">{value.toLocaleString("fr-FR")}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
