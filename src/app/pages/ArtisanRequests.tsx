import { useEffect, useState, useCallback } from "react";
import { Search, Check, X, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Rejeter la candidature</h3>
        <p className="text-sm text-gray-600 mb-4">{artisan.user_name}</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motif du rejet (sera envoyé à l'artisan)..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none mb-4"
        />
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button
            onClick={() => onConfirm(reason || "Critères non respectés.")}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
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
    if (!confirm(`Approuver la candidature de ${req.user_name} ?`)) return;
    setActionLoading(req.id);
    try {
      await approveArtisanRequest(req.id);
      fetchRequests();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur.");
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
      alert(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setActionLoading(null);
    }
  };

  // Filtre local par recherche (nom ou métier)
  const displayed = search.trim()
    ? requests.filter(
        (r) =>
          r.user_name.toLowerCase().includes(search.toLowerCase()) ||
          r.metiers.some((m) => m.toLowerCase().includes(search.toLowerCase()))
      )
    : requests;

  const statusLabel = (r: ArtisanRequest) => {
    if (r.is_verified)                    return { label: "Approuvée",  cls: "bg-green-100 text-green-800" };
    if (r.demande_verification_soumise)   return { label: "En attente", cls: "bg-amber-100 text-amber-800" };
    return                                       { label: "Non soumise", cls: "bg-gray-100 text-gray-600" };
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Demandes Artisan</h1>
          <p className="text-gray-600 mt-1">Validez les candidatures des artisans</p>
        </div>
        <button onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Rechercher par nom ou métier..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilter(e.target.value as ArtisanRequestStatus)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="pending">En attente</option>
            <option value="verified">Approuvées</option>
            <option value="not_submitted">Non soumises</option>
          </select>
        </div>
      </div>

      {/* Compteur */}
      <p className="text-sm text-gray-500 mb-4">
        {total} candidature{total > 1 ? "s" : ""} — {displayed.length} affichée{displayed.length > 1 ? "s" : ""}
      </p>

      {/* Erreur */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchRequests} className="text-sm underline">Réessayer</button>
        </div>
      )}

      {/* Liste */}
      {loading && requests.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-3" />
          <span className="text-gray-600">Chargement...</span>
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          Aucune candidature trouvée.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayed.map((req) => {
            const { label, cls } = statusLabel(req);
            const isActing = actionLoading === req.id;
            return (
              <div key={req.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    {/* En-tête */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{req.user_name}</h3>
                        <p className="text-sm text-gray-500">{req.user_phone} · {req.user_email}</p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${cls}`}>
                        {label}
                      </span>
                    </div>

                    {/* Infos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700 mb-1">Métiers</p>
                        <p className="text-gray-600">{req.metiers.join(", ") || "—"}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700 mb-1">Soumis le</p>
                        <p className="text-gray-600">{new Date(req.created_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="font-medium text-gray-700 mb-1">Description</p>
                        <p className="text-gray-600 leading-relaxed">{req.description}</p>
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="flex flex-wrap gap-3">
                      {req.photo_cip_url && (
                        <button
                          onClick={() => setZoomImage({ url: req.photo_cip_url!, title: `CIP — ${req.user_name}` })}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                        >
                          Voir CIP
                        </button>
                      )}
                      {req.photo_diplome_url && (
                        <button
                          onClick={() => setZoomImage({ url: req.photo_diplome_url!, title: `Diplôme — ${req.user_name}` })}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm"
                        >
                          Voir Diplôme
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions — uniquement pour les candidatures en attente */}
                  {req.demande_verification_soumise && !req.is_verified && (
                    <div className="flex lg:flex-col gap-3 shrink-0">
                      <button
                        onClick={() => handleApprove(req)}
                        disabled={isActing}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {isActing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-5 h-5" />}
                        Approuver
                      </button>
                      <button
                        onClick={() => setRejectTarget(req)}
                        disabled={isActing}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <X className="w-5 h-5" />
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
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">Page {page} sur {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
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
