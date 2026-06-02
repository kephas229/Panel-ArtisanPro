import { useEffect, useState, useCallback, useMemo } from "react";
import { Search, AlertTriangle, Check, X, Eye, RefreshCw, ChevronLeft, ChevronRight, User, ShieldAlert, CheckCircle2, Clock } from "lucide-react";
import {
  listReports,
  updateReportStatus,
  type Signalement,
  type SignalementStatut,
} from "../../api/reports";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUT_LABELS: Record<SignalementStatut, { label: string; cls: string; icon: any }> = {
  ouvert:           { label: "Nouveau",          cls: "bg-amber-100 text-amber-800 border-amber-200", icon: AlertTriangle },
  en_investigation: { label: "En investigation", cls: "bg-blue-100 text-blue-800 border-blue-200", icon: Clock },
  averti:           { label: "Averti",           cls: "bg-orange-100 text-orange-800 border-orange-200", icon: AlertTriangle },
  resolu:           { label: "Résolu",           cls: "bg-green-100 text-green-800 border-green-200", icon: Check },
  ferme:            { label: "Fermé",            cls: "bg-gray-100 text-gray-600 border-gray-200", icon: X },
};

const TYPE_LABELS: Record<string, string> = {
  plainte: "Plainte",
  abus:    "Abus",
  aide:    "Demande d'aide",
};

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "?";
}

// ── Page Reports ──────────────────────────────────────────────────────────────

export function Reports() {
  const [reports, setReports]     = useState<Signalement[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilter] = useState<SignalementStatut | "">("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selected, setSelected]           = useState<Signalement | null>(null);

  const PAGE_SIZE  = 20;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listReports({
        status:    filterStatus || undefined,
        page,
        page_size: PAGE_SIZE,
      });
      setReports(res.results);
      setTotal(res.count);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, page]);

  useEffect(() => { fetchReports(); }, [fetchReports]);
  useEffect(() => { setPage(1); }, [filterStatus]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleStatus = async (id: number, statut: SignalementStatut) => {
    setActionLoading(id);
    try {
      await updateReportStatus(id, statut);
      showSuccess(`Signalement passé au statut "${STATUT_LABELS[statut].label}"`);
      fetchReports();
      if (selected && selected.id === id) {
        setSelected(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setActionLoading(null);
    }
  };

  // Filtre local par recherche
  const displayed = useMemo(() => {
    if (!search.trim()) return reports;
    return reports.filter((r) =>
      r.artisan_name.toLowerCase().includes(search.toLowerCase()) ||
      r.reporter_name.toLowerCase().includes(search.toLowerCase()) ||
      r.raison.toLowerCase().includes(search.toLowerCase())
    );
  }, [reports, search]);

  return (
    <div className="p-8">
      {/* En-tête compact */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-none">Signalements</h1>
            <p className="text-sm text-gray-500 mt-1">Suivez et modérez les conflits entre clients et artisans</p>
          </div>
        </div>
        <button onClick={fetchReports}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Notifications globales */}
      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center gap-3 shadow-sm transition-all text-sm">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}
      {error && !selected && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between shadow-sm transition-all text-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded-md">
             <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filtres & Recherche sur une seule ligne */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-2 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input type="text" placeholder="Rechercher artisan, plaignant..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
        </div>
        <div className="flex gap-1 overflow-x-auto hide-scrollbar border-l border-gray-100 pl-3">
          <button
            onClick={() => setFilter("")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filterStatus === "" 
                ? "bg-gray-800 text-white shadow-sm" 
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            Tous ({filterStatus === "" ? total : "-"})
          </button>
          {(Object.entries(STATUT_LABELS) as [SignalementStatut, any][]).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                  filterStatus === key 
                    ? `bg-gray-100 text-gray-900 border border-gray-300 shadow-sm` 
                    : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <Icon className={`w-4 h-4 ${filterStatus === key ? config.cls.split(" ")[1] : ""}`} />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste des signalements */}
      {loading && reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-4" />
          <span className="text-gray-500 font-medium text-sm">Récupération des dossiers...</span>
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 border-dashed p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
            <Check className="w-6 h-6 text-green-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Aucun signalement trouvé</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            {search ? "Essayez de modifier vos critères de recherche." : "Tout semble en ordre !"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {displayed.map((report) => {
            const { label: sLabel, cls: sCls, icon: SIcon } = STATUT_LABELS[report.statut] ?? { label: report.statut, cls: "bg-gray-100 text-gray-800 border-gray-200", icon: AlertTriangle };

            return (
              <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                {/* Header carte */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm">
                      {getInitials(report.artisan_name)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm leading-tight">
                        {report.artisan_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-100">
                          {TYPE_LABELS[report.type] ?? report.type}
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium">★ {report.artisan_rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${sCls}`}>
                    <SIcon className="w-3 h-3" />
                    {sLabel}
                  </span>
                </div>

                {/* Body carte */}
                <div className="p-4 flex-1 flex flex-col text-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 font-medium">{report.reporter_name}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-500 text-xs">{report.reporter_phone}</span>
                  </div>

                  <div className="mb-4 flex-1">
                    <p className="text-gray-800 line-clamp-2 leading-relaxed">
                      "{report.raison}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400 font-medium">
                      {new Date(report.created_at).toLocaleDateString("fr-FR")}
                    </span>
                    <button onClick={() => setSelected(report)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider">
                      <Eye className="w-3.5 h-3.5" />
                      Traiter
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-600 ml-2">Page <span className="font-semibold text-gray-900">{page}</span> / {totalPages}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* Modal détail riche */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            
            {/* Header Modal */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Dossier #{selected.id}</h3>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Ouvert le {new Date(selected.created_at).toLocaleString("fr-FR")}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-200 text-gray-500 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Encadré Artisan */}
                <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(selected.artisan_name)}
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Artisan Mis en Cause</h4>
                    <p className="font-bold text-gray-900 text-sm leading-tight">{selected.artisan_name}</p>
                    <p className="text-[11px] text-amber-500 font-medium">★ {selected.artisan_rating.toFixed(1)}</p>
                  </div>
                </div>

                {/* Encadré Plaignant */}
                <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                    {getInitials(selected.reporter_name)}
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Plaignant</h4>
                    <p className="font-bold text-gray-900 text-sm leading-tight">{selected.reporter_name}</p>
                    <p className="text-[11px] text-gray-500">{selected.reporter_phone}</p>
                  </div>
                </div>
              </div>

              {/* Détails signalement */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-sm font-bold text-gray-900">Motif du signalement</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-100">
                    {TYPE_LABELS[selected.type] ?? selected.type}
                  </span>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-800 leading-relaxed shadow-inner">
                  "{selected.raison}"
                </div>
              </div>

              {/* Statut actuel */}
              <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Statut actuel</p>
                  <p className="text-[10px] text-gray-400">Maj : {new Date(selected.updated_at).toLocaleString("fr-FR")}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border shadow-sm ${STATUT_LABELS[selected.statut]?.cls}`}>
                  {(() => {
                    const SIcon = STATUT_LABELS[selected.statut]?.icon || AlertTriangle;
                    return <SIcon className="w-3.5 h-3.5" />;
                  })()}
                  {STATUT_LABELS[selected.statut]?.label}
                </span>
              </div>
            </div>

            {/* Footer Modal : Actions Administratives */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-2 items-center justify-end">
              {(selected.statut === "ouvert" || selected.statut === "en_investigation") ? (
                <>
                  <button onClick={() => handleStatus(selected.id, "averti")}
                    disabled={actionLoading === selected.id}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm font-bold text-xs uppercase tracking-wider disabled:opacity-50">
                    {actionLoading === selected.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    Avertir l'artisan (Risque de ban)
                  </button>
                  <button onClick={() => handleStatus(selected.id, "resolu")}
                    disabled={actionLoading === selected.id}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-sm font-bold text-xs uppercase tracking-wider disabled:opacity-50">
                    {actionLoading === selected.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Résoudre (Contacter l'équipe)
                  </button>
                  <button onClick={() => handleStatus(selected.id, "ferme")}
                    disabled={actionLoading === selected.id}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors shadow-sm font-bold text-xs uppercase tracking-wider disabled:opacity-50">
                    <X className="w-3.5 h-3.5" />
                    Rejeter (Faux signalement)
                  </button>
                </>
              ) : (
                <p className="text-xs text-gray-500 w-full text-center">
                  Dossier traité (<strong>{STATUT_LABELS[selected.statut].label}</strong>).
                </p>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
