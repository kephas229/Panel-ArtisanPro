import { useEffect, useState } from "react";
import { Users, UserCheck, Star, Flag, RefreshCw, Activity, ArrowUpRight, ArrowDownRight, Layers, Box } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, AreaChart, Area
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
  iconBg: string;
}

function StatCard({ title, value, sub, trend, icon: Icon, color, iconBg }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          trend === "up" ? "bg-emerald-50 text-emerald-600" : trend === "down" ? "bg-rose-50 text-rose-600" : "bg-gray-50 text-gray-600"
        }`}>
          {trend === "up"   && <ArrowUpRight   className="w-3.5 h-3.5" />}
          {trend === "down" && <ArrowDownRight className="w-3.5 h-3.5" />}
          {trend === "neutral" && <Activity className="w-3.5 h-3.5" />}
          <span>{sub}</span>
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">
          {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
        </h3>
        <p className="text-sm font-medium text-gray-500">{title}</p>
      </div>
    </div>
  );
}

// ── Custom Tooltip pour Recharts ──────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100 z-50">
        <p className="text-sm font-bold text-gray-900 mb-1">{label}</p>
        {payload.map((p: any, idx: number) => (
          <p key={idx} className="text-sm font-semibold flex items-center gap-2" style={{ color: p.fill || p.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill || p.color }}></span>
            {p.name} : {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

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
        { label: "En attente", value: stats.demandes_en_attente,  fill: "#f59e0b" }, // Amber
        { label: "Acceptées",  value: stats.demandes_acceptees,   fill: "#3b82f6" }, // Blue
        { label: "Terminées",  value: stats.demandes_terminees,   fill: "#10b981" }, // Emerald
      ]
    : [];

  const artisansData = stats
    ? [
        { label: "Vérifiés",     value: stats.artisans_verifies,     fill: "#8b5cf6" }, // Violet
        { label: "En attente", value: stats.artisans_non_verifies, fill: "#e2e8f0" }, // Slate 200
      ]
    : [];

  // ── Rendu ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[80vh]">
        <div className="text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
             <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <p className="text-gray-500 font-medium tracking-wide">Synchronisation des données...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8">
        <div className="bg-red-50/80 border border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto mt-20 shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-red-900 mb-2">Problème de connexion</h3>
          <p className="text-red-700 mb-6">{error ?? "Impossible de charger les statistiques."}</p>
          <button
            onClick={fetchStats}
            className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-sm"
          >
            Tenter une reconnexion
          </button>
        </div>
      </div>
    );
  }

  const statCards: StatCardProps[] = [
    {
      title: "Utilisateurs total",
      value: stats.total_users,
      sub:   `${stats.total_artisans} artisans`,
      trend: "up",
      icon:  Users,
      color: "text-blue-600",
      iconBg: "bg-blue-100/80",
    },
    {
      title: "Artisans vérifiés",
      value: stats.artisans_verifies,
      sub:   `${stats.artisans_non_verifies} en attente`,
      trend: stats.artisans_non_verifies > 0 ? "up" : "neutral",
      icon:  UserCheck,
      color: "text-violet-600",
      iconBg: "bg-violet-100/80",
    },
    {
      title: "Avis clients",
      value: stats.total_avis,
      sub:   `Sur ${stats.demandes_terminees} jobs`,
      trend: "up",
      icon:  Star,
      color: "text-amber-500",
      iconBg: "bg-amber-100/80",
    },
    {
      title: "Dossiers signalés",
      value: stats.signalements_ouverts,
      sub:   `${stats.total_signalements} ouverts`,
      trend: stats.signalements_ouverts > 0 ? "down" : "neutral",
      icon:  Flag,
      color: "text-rose-500",
      iconBg: "bg-rose-100/80",
    },
  ];

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* En-tête */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Vue d'ensemble</h1>
          <p className="text-gray-500 mt-1 font-medium text-sm">Supervisez l'activité et les performances de la plateforme</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
          Actualiser
        </button>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        
        {/* Graphique 1 : Demandes */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] p-6 border border-gray-100 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Layers className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Activité des Demandes</h3>
              <p className="text-xs font-medium text-gray-400">Répartition par statut actuel</p>
            </div>
          </div>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demandesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" name="Volume" radius={[6, 6, 6, 6]} barSize={40}>
                  {demandesData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique 2 : Artisans */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] p-6 border border-gray-100 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Vérification des Artisans</h3>
              <p className="text-xs font-medium text-gray-400">Proportion des profils validés</p>
            </div>
          </div>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={artisansData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" name="Artisans" radius={[6, 6, 6, 6]} barSize={30}>
                  {artisansData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Résumé chiffres clés */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <Box className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Impact Global</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Total requêtes traitées", value: stats.total_demandes, color: "text-blue-400" },
              { label: "Matchs en cours",         value: stats.demandes_acceptees, color: "text-emerald-400" },
              { label: "Retours d'expérience",    value: stats.total_avis, color: "text-amber-400" },
              { label: "Conflits signalés",       value: stats.total_signalements, color: "text-rose-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex flex-col">
                <span className={`text-4xl font-extrabold mb-2 ${color}`}>
                  {value.toLocaleString("fr-FR")}
                </span>
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
