import { useEffect, useState, useCallback } from "react";
import { Search, Ban, CheckCircle2, XCircle, ChevronLeft, ChevronRight, RefreshCw, X, UserPlus, Shield, Wrench, User as UserIcon, Check } from "lucide-react";
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
  useEffect(() => { setPage(1); }, [debouncedSearch, role, statusFilter]);

  const handleBan = async (user: UserAdmin) => {
    const action = user.is_active ? "ban" : "unban";
    const label  = action === "ban" ? "suspendre" : "réactiver";
    if (!confirm(`Voulez-vous vraiment ${label} le compte de ${user.full_name} ?`)) return;

    setBanLoading(user.id);
    try {
      await banUser(user.id, action);
      fetchUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Action impossible.");
    } finally {
      setBanLoading(null);
    }
  };

  const getRoleConfig = (u: UserAdmin) => {
    if (u.is_staff)    return { label: "Admin",   color: "text-emerald-700 bg-emerald-50 ring-emerald-600/20", icon: Shield };
    if (u.is_artisan)  return { label: "Artisan", color: "text-violet-700 bg-violet-50 ring-violet-600/20", icon: Wrench };
    return               { label: "Client",  color: "text-blue-700 bg-blue-50 ring-blue-600/20", icon: UserIcon };
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* En-tête */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Utilisateurs</h1>
          <p className="text-gray-500 mt-1 font-medium text-sm">
            {loading ? "Synchronisation en cours..." : `Gestion des ${total.toLocaleString("fr-FR")} membres inscrits`}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg"
          >
            <UserPlus className="w-4 h-4" />
            Nouvel Admin
          </button>
        </div>
      </div>

      {/* Barre de Recherche & Filtres (Unifiée) */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] p-2 mb-8 border border-gray-100 flex flex-col lg:flex-row gap-2">
        <div className="flex-1 relative flex items-center">
          <Search className="absolute left-4 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
          />
        </div>
        <div className="h-px lg:h-auto lg:w-px bg-gray-100 mx-2"></div>
        <div className="flex gap-2">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-700 cursor-pointer focus:ring-2 focus:ring-slate-900 appearance-none"
          >
            <option value="">Tous les rôles</option>
            <option value="client">Clients uniquement</option>
            <option value="artisan">Artisans uniquement</option>
            <option value="admin">Administrateurs</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value)}
            className="pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-700 cursor-pointer focus:ring-2 focus:ring-slate-900 appearance-none"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Comptes Actifs</option>
            <option value="inactive">Comptes Suspendus</option>
          </select>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center justify-between text-sm font-medium">
          <span>{error}</span>
          <button onClick={fetchUsers} className="underline hover:text-rose-900">Réessayer</button>
        </div>
      )}

      {/* Tableau Modernisé */}
      <div className="bg-white rounded-3xl shadow-[0_2px_20px_-3px_rgba(6,81,237,0.05)] border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Membre</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Rôle</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Statut du compte</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date d'inscription</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Activité</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Modération</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-500">Chargement de l'annuaire...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">Aucun utilisateur trouvé</p>
                    <p className="text-xs text-gray-500 mt-1">Modifiez vos critères de recherche.</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const roleCfg = getRoleConfig(user);
                  const RoleIcon = roleCfg.icon;
                  return (
                    <tr key={user.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {user.photo_url ? (
                            <img src={user.photo_url} alt={user.full_name}
                              className="w-12 h-12 rounded-full object-cover shadow-sm ring-1 ring-gray-100" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm ring-1 ring-slate-200/50">
                              {user.full_name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-900 text-sm leading-tight">{user.full_name}</p>
                            <p className="text-xs font-medium text-gray-500 mt-0.5">{user.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ring-1 ring-inset ${roleCfg.color}`}>
                          <RoleIcon className="w-3.5 h-3.5" />
                          {roleCfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`relative flex h-2.5 w-2.5`}>
                            {user.is_active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${user.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          </span>
                          <span className={`text-sm font-semibold ${user.is_active ? 'text-gray-700' : 'text-rose-600'}`}>
                            {user.is_active ? 'Actif' : 'Suspendu'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-500">
                        {new Date(user.created_at).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-gray-500">
                            {user.demandes_count} demande(s)
                          </span>
                          {user.signalements_recus > 0 && (
                            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 inline-block px-1.5 py-0.5 rounded w-max">
                              {user.signalements_recus} signalement(s)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleBan(user)}
                          disabled={banLoading === user.id}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 ${
                            user.is_active
                              ? "text-rose-600 hover:bg-rose-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {banLoading === user.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : user.is_active ? (
                            <><Ban className="w-4 h-4" /> Suspendre</>
                          ) : (
                            <><CheckCircle2 className="w-4 h-4" /> Réactiver</>
                          )}
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
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
            <p className="text-sm font-medium text-gray-500">
              Page <span className="text-gray-900 font-bold">{page}</span> sur {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:shadow-none transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:shadow-none transition-all"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal créer admin */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-slate-700" />
                </div>
                <h2 className="text-xl font-extrabold text-gray-900">Nouvel Admin</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6">
              <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                Création sécurisée
              </p>
              <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                Pour des raisons de sécurité, la création de comptes administrateurs super-utilisateurs se fait via le terminal serveur.
              </p>
              <div className="bg-slate-900 rounded-xl p-3 shadow-inner">
                <code className="text-xs font-mono text-emerald-400 block">
                  $ python manage.py createsuperuser
                </code>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateModal(false)}
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
