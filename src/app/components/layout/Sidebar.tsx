import { Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Flag,
  Wrench,
  LogOut,
  MapPin,
  Map,
  Briefcase,
} from "lucide-react";
import { useState, useEffect } from "react";
import { clearToken } from "../../../api/client";

const navItems = [
  { path: "/",                  label: "Tableau de bord",  icon: LayoutDashboard },
  { path: "/users",             label: "Utilisateurs",     icon: Users },
  { path: "/artisan-requests",  label: "Demandes Artisan", icon: UserCheck },
  { path: "/reports",           label: "Signalements",     icon: Flag },
  { path: "/metiers",           label: "Métiers",          icon: Briefcase },
  { path: "/villes",            label: "Villes",           icon: Map },
  { path: "/zones",             label: "Zones",            icon: MapPin },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState("admin@artisanpro.bj");

  useEffect(() => {
    const currentAdmin = localStorage.getItem("currentAdmin");
    if (currentAdmin) {
      try {
        const admin = JSON.parse(currentAdmin);
        // Le vrai login stocke full_name (pas name)
        setAdminName(admin.full_name || admin.name || "Admin");
        setAdminEmail(admin.email || admin.phone || "");
      } catch {
        // JSON corrompu → déconnexion
        localStorage.removeItem("currentAdmin");
      }
    }
  }, []);

  const handleLogout = () => {
    clearToken();
    localStorage.removeItem("currentAdmin");
    navigate("/login");
  };

  return (
    <div className="w-64 bg-[#0F172A] text-white h-screen flex flex-col">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg">ArtisanPro</h1>
            <p className="text-xs text-white/60">Back Office</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="font-semibold">{adminName[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{adminName}</p>
            <p className="text-xs text-white/60 truncate">{adminEmail}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}