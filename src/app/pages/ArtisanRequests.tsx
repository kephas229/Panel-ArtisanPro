import { useEffect, useState, useCallback } from "react";
import { Search, Check, X, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2, XCircle, FileText, FileBadge } from "lucide-react";
import {
  listArtisanRequests,
  approveArtisanRequest,
  rejectArtisanRequest,
  type ArtisanRequest,
  type ArtisanRequestStatus,
} from "../../api/artisanRequests";
import { ImageZoomModal } from "../components/ImageZoomModal";

// ── Modal de rejet ────────────────────────────────────────────────────────────

interface RejectModalProps {
  artisan: ArtisanRequest;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

function RejectModal({ artisan, onConfirm, onClose }: RejectModalProps) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-extrabold text-gray-900">Rejeter la candidature</h3>
            <p className="text-sm font-medium text-gray-500 mt-1">{artisan.user_name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Motif du rejet</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Expliquez brièvement pourquoi la candidature est refusée (sera envoyé à l'artisan)..."
            rows={4}
            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-rose-500 text-sm font-medium text-gray-900 placeholder-gray-400 resize-none"
          />
        </div>
        
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button
            onClick={() => onConfirm(reason || "Critères non respectés.")}
            className="flex-1 px-4 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-md">
            Confirmer le rejet
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ArtisanRequests ──────────────────────────────────────────────────────

export function ArtisanRequests() {
  const [requests, setRequests]   = useState<ArtisanRequest[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilter] = useState<ArtisanRequestStatus>("pending");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget]   = useState<ArtisanRequest | null>(null);
  const [zoomImage, setZoomImage]         = useState<{ url: string; title: string } | null>(null);

  const PAGE_SIZE  = 20;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listArtisanRequests({ status: filterStatus, page, page_size: PAGE_SIZE });
      setRequests(res.results);
      setTotal(res.count);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, page]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  useEffect(() => { setPage(1); }, [filterStatus]);

  const handleApprove = async (req: ArtisanRequest) => {
    if (!confirm(`Voulez-vous approuver la candidature de ${req.user_name} ?`)) return;
    setActionLoading(req.id);
    try {
      await approveArtisanRequest(req.id);
      fetchRequests();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Action impossible.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget.id);
    setRejectTarget(null);
    try {
      await rejectArtisanRequest(rejectTarget.id, reason);
      fetchRequests();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Action impossible.");
    } finally {
      setActionLoading(null);
    }
  };

  const displayed = search.trim()
    ? requests.filter(
        (r) =>
          r.user_name.toLowerCase().includes(search.toLowerCase()) ||
          r.metiers.some((m) => m.toLowerCase().includes(search.toLowerCase()))
      )
    : requests;

  const getStatusConfig = (r: ArtisanRequest) => {
    if (r.is_verified)                  return { label: "Approuvée", color: "text-emerald-700 bg-emerald-50 ring-emerald-600/20", icon: CheckCircle2 };
    if (r.demande_verification_soumise) return { label: "En attente", color: "text-amber-700 bg-amber-50 ring-amber-600/20", icon: RefreshCw };
    return                              { label: "Non soumise", color: "text-gray-700 bg-gray-50 ring-gray-600/20", icon: XCircle };
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* En-tête */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Candidatures Artisans</h1>
          <p className="text-gray-500 mt-1 font-medium text-sm">Vérifiez et validez les dossiers d'inscription des professionnels</p>
        </div>
        <button onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Barre de Recherche & Filtres (Unifiée) */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] p-2 mb-8 border border-gray-100 flex flex-col lg:flex-row gap-2">
        <div className="flex-1 relative flex items-center">
          <Search className="absolute left-4 text-gray-400 w-5 h-5" />
          <input type="text" placeholder="Rechercher un artisan ou un métier..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0" />
        </div>
        <div className="h-px lg:h-auto lg:w-px bg-gray-100 mx-2"></div>
        <div className="flex">
          <select value={filterStatus} onChange={(e) => setFilter(e.target.value as ArtisanRequestStatus)}
            className="pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-700 cursor-pointer focus:ring-2 focus:ring-slate-900 appearance-none min-w-[200px]">
            <option value="pending">Dossiers en attente</option>
            <option value="verified">Profils approuvés</option>
            <option value="not_submitted">Non soumis (Brouillon)</option>
          </select>
        </div>
      </div>

      {/* Info d'affichage */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">
          <span className="font-bold text-gray-900">{total}</span> candidature(s) trouvée(s)
        </p>
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center justify-between text-sm font-medium">
          <span>{error}</span>
          <button onClick={fetchRequests} className="underline hover:text-rose-900">Réessayer</button>
        </div>
      )}

      {/* Liste (Cartes) */}
      {loading && requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
             <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <span className="text-sm font-medium text-gray-500">Chargement des dossiers...</span>
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-[0_2px_20px_-3px_rgba(6,81,237,0.05)]">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-base font-bold text-gray-900">Aucun dossier à afficher</p>
          <p className="text-sm text-gray-500 mt-1">Essayez de modifier vos critères de filtrage.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {displayed.map((req) => {
            const statusCfg = getStatusConfig(req);
            const StatusIcon = statusCfg.icon;
            const isActing = actionLoading === req.id;
            
            return (
              <div key={req.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-col">
                {/* En-tête de carte */}
                <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-100">
                  <div className="flex gap-4 items-center">
                    {req.user_photo_url ? (
                      <img src={req.user_photo_url} alt={req.user_name}
                        className="w-14 h-14 rounded-full object-cover shadow-md ring-1 ring-gray-100" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white font-bold text-xl shadow-md">
                        {req.user_name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-extrabold text-gray-900 tracking-tight leading-tight mb-1">{req.user_name}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-gray-500">
                        <span>{req.user_phone}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span>{req.user_email}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide ring-1 ring-inset ${statusCfg.color} shrink-0`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${req.demande_verification_soumise && !req.is_verified ? 'animate-spin-slow' : ''}`} />
                    {statusCfg.label}
                  </span>
                </div>

                {/* Contenu principal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 flex-1">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Métiers exercés</h4>
                    <div className="flex flex-wrap gap-2">
                      {req.metiers.length > 0 ? req.metiers.map(m => (
                        <span key={m} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg">
                          {m}
                        </span>
                      )) : <span className="text-sm font-medium text-gray-500">—</span>}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Dépôt du dossier</h4>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(req.created_at).toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Présentation</h4>
                    <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                      <p className="text-sm text-gray-700 font-medium leading-relaxed italic">
                        "{req.description || "Aucune description fournie par l'artisan."}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer de la carte (Documents & Actions) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {req.photo_cip_url && (
                      <button
                        onClick={() => setZoomImage({ url: req.photo_cip_url!, title: `CIP — ${req.user_name}` })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs font-bold uppercase tracking-wide"
                      >
                        <FileBadge className="w-4 h-4" /> Pièce d'identité
                      </button>
                    )}
                    {req.photo_diplome_url && (
                      <button
                        onClick={() => setZoomImage({ url: req.photo_diplome_url!, title: `Diplôme — ${req.user_name}` })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition-colors text-xs font-bold uppercase tracking-wide"
                      >
                        <FileText className="w-4 h-4" /> Certificat/Diplôme
                      </button>
                    )}
                    {!req.photo_cip_url && !req.photo_diplome_url && (
                      <span className="text-xs font-semibold text-gray-400">Aucun document joint</span>
                    )}
                  </div>

                  {req.demande_verification_soumise && !req.is_verified && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(req)}
                        disabled={isActing}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white font-bold text-sm rounded-xl hover:bg-emerald-600 transition-all shadow-sm disabled:opacity-50"
                      >
                        {isActing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Valider
                      </button>
                      <button
                        onClick={() => setRejectTarget(req)}
                        disabled={isActing}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-rose-600 font-bold text-sm rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Rejeter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-between bg-white px-6 py-4 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100">
          <p className="text-sm font-medium text-gray-500">
            Page <span className="font-bold text-gray-900">{page}</span> sur {totalPages}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:shadow-none transition-all">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:shadow-none transition-all">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {rejectTarget && (
        <RejectModal artisan={rejectTarget} onConfirm={handleReject} onClose={() => setRejectTarget(null)} />
      )}
      {zoomImage && (
        <ImageZoomModal imageUrl={zoomImage.url} title={zoomImage.title} onClose={() => setZoomImage(null)} />
      )}
    </div>
  );
}
