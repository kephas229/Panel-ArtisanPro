import { useEffect, useState, useCallback } from "react";
import { Search, Ban, CheckCircle, XCircle, ChevronLeft, ChevronRight, RefreshCw, X, UserPlus } from "lucide-react";
import { listUsers, banUser, type UserAdmin } from "../../api/users";

// ── Helpers ───────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Page Users ────────────────────────────────────────────────────────────────

export function Users() {
  const [users, setUsers]         = useState<UserAdmin[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState("");
  const [role, setRole]           = useState("");
  const [statusFilter, setStatus] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [banLoading, setBanLoading] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const debouncedSearch = useDebounce(search);
  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listUsers({
        search:    debouncedSearch || undefined,
        role:      role || undefined,
        status:    statusFilter || undefined,
        page,
        page_size: PAGE_SIZE,
      });
      setUsers(res.results);
      setTotal(res.count);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, role, statusFilter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Reset page quand les filtres changent
  useEffect(() => { setPage(1); }, [debouncedSearch, role, statusFilter]);

  const handleBan = async (user: UserAdmin) => {
    const action = user.is_active ? "ban" : "unban";
    const label  = action === "ban" ? "bannir" : "débannir";
    if (!confirm(`Voulez-vous ${label} ${user.full_name} ?`)) return;

    setBanLoading(user.id);
    try {
      await banUser(user.id, action);
      fetchUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBanLoading(null);
    }
  };

  const roleLabel = (u: UserAdmin) => {
    if (u.is_staff)    return { label: "Admin",   cls: "bg-green-100 text-green-800" };
    if (u.is_artisan)  return { label: "Artisan", cls: "bg-purple-100 text-purple-800" };
    return               { label: "Client",  cls: "bg-blue-100 text-blue-800" };
  };

  return (
    <div className="p-8">
      {/* En-tête */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
          <p className="text-gray-600 mt-1">
            {total > 0 ? `${total.toLocaleString("fr-FR")} utilisateurs` : "Chargement..."}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Créer un admin
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les rôles</option>
            <option value="client">Clients</option>
            <option value="artisan">Artisans</option>
            <option value="admin">Administrateurs</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Suspendus</option>
          </select>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchUsers} className="text-sm underline">Réessayer</button>
        </div>
      )}

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inscription</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demandes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signalements</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Chargement...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const { label, cls } = roleLabel(user);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.photo_url ? (
                            <img src={user.photo_url} alt={user.full_name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                              {user.full_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{user.full_name}</p>
                            <p className="text-sm text-gray-500">{user.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
                          {label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {user.is_active
                            ? <><CheckCircle className="w-3 h-3" /> Actif</>
                            : <><XCircle    className="w-3 h-3" /> Suspendu</>
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {user.demandes_count}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {user.signalements_recus > 0 ? (
                          <span className="text-red-600 font-semibold">{user.signalements_recus}</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleBan(user)}
                          disabled={banLoading === user.id}
                          title={user.is_active ? "Bannir" : "Débannir"}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                            user.is_active
                              ? "text-gray-400 hover:text-red-600 hover:bg-red-50"
                              : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {banLoading === user.id
                            ? <RefreshCw className="w-4 h-4 animate-spin" />
                            : <Ban className="w-4 h-4" />
                          }
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {page} sur {totalPages} — {total.toLocaleString("fr-FR")} résultats
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal créer admin — info uniquement (création via Django admin ou manage.py) */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Créer un administrateur</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 space-y-2">
              <p className="font-semibold">Création via le terminal Django :</p>
              <code className="block bg-blue-100 rounded p-2 text-xs font-mono">
                python manage.py createsuperuser
              </code>
              <p>Ou via l'interface Django Admin :</p>
              <code className="block bg-blue-100 rounded p-2 text-xs font-mono">
                /admin/ → Utilisateurs → Ajouter
              </code>
            </div>
            <button
              onClick={() => setShowCreateModal(false)}
              className="mt-6 w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
