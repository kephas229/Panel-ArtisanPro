import { useEffect, useState, useCallback } from "react";
import { Search, Star, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { listAvis, type Avis } from "../../api/avis";

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function Reviews() {
  const [avis, setAvis]           = useState<Avis[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState("");
  const [filterNote, setFilterNote] = useState<"" | "1" | "2" | "3" | "4" | "5">("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const debouncedSearch = useDebounce(search);
  const PAGE_SIZE  = 20;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchAvis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAvis({ page, page_size: PAGE_SIZE });
      setAvis(res.data.results);
      setTotal(res.data.count);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchAvis(); }, [fetchAvis]);
  useEffect(() => { setPage(1); }, [filterNote]);

  // Filtre local (recherche + note) — les données sont déjà paginées côté serveur
  const displayed = avis.filter((a) => {
    const matchSearch =
      !debouncedSearch.trim() ||
      a.client.full_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (a.commentaire ?? "").toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchNote = !filterNote || a.note === parseInt(filterNote);
    return matchSearch && matchNote;
  });

  // Stats calculées sur la page courante
  const avgRating =
    avis.length > 0
      ? (avis.reduce((s, a) => s + a.note, 0) / avis.length).toFixed(1)
      : "—";
  const dist = [5, 4, 3, 2, 1].map((n) => ({
    note: n,
    count: avis.filter((a) => a.note === n).length,
  }));

  return (
    <div className="p-8">
      {/* En-tête */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Avis Clients</h1>
          <p className="text-gray-600 mt-1">
            Consultation des avis laissés par les clients — lecture seule
          </p>
        </div>
        <button
          onClick={fetchAvis}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 col-span-2 md:col-span-1">
          <p className="text-sm text-gray-600 mb-1">Total avis</p>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 col-span-2 md:col-span-1">
          <p className="text-sm text-gray-600 mb-1">Note moyenne</p>
          <div className="flex items-center gap-1">
            <p className="text-2xl font-bold text-gray-900">{avgRating}</p>
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
        </div>
        {dist.map(({ note, count }) => (
          <div key={note} className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">{note} étoile{note > 1 ? "s" : ""}</p>
            <p className="text-2xl font-bold text-gray-900">{count}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par client ou commentaire..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterNote}
            onChange={(e) => setFilterNote(e.target.value as typeof filterNote)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les notes</option>
            <option value="5">5 étoiles</option>
            <option value="4">4 étoiles</option>
            <option value="3">3 étoiles</option>
            <option value="2">2 étoiles</option>
            <option value="1">1 étoile</option>
          </select>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchAvis} className="text-sm underline">Réessayer</button>
        </div>
      )}

      {/* Liste */}
      {loading && avis.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-3" />
          <span className="text-gray-600">Chargement...</span>
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          Aucun avis trouvé.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayed.map((a) => (
            <div key={a.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                {/* Client */}
                <div className="flex items-center gap-3">
                  {a.client.photo_url ? (
                    <img
                      src={a.client.photo_url}
                      alt={a.client.full_name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                      {a.client.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{a.client.full_name}</p>
                    <p className="text-xs text-gray-500">{a.client.phone}</p>
                  </div>
                </div>

                {/* Date */}
                <p className="text-xs text-gray-400">
                  {new Date(a.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>

              {/* Note */}
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= a.note
                        ? "text-amber-400 fill-amber-400"
                        : "text-gray-200 fill-gray-200"
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm font-medium text-gray-700">{a.note}/5</span>
              </div>

              {/* Commentaire */}
              {a.commentaire ? (
                <p className="text-sm text-gray-700 leading-relaxed">{a.commentaire}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">Aucun commentaire.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {page} sur {totalPages} — {total.toLocaleString("fr-FR")} avis
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
