import { Outlet, useNavigate } from "react-router";
import { Sidebar } from "./Sidebar";
import { useEffect } from "react";
import { getToken, clearToken } from "../../../api/client";

export function Root() {
  const navigate = useNavigate();

  useEffect(() => {
    const admin = localStorage.getItem("currentAdmin");
    const token = getToken();

    if (!admin || !token) {
      // Pas de session → login
      clearToken();
      localStorage.removeItem("currentAdmin");
      navigate("/login");
      return;
    }

    // Vérification légère : le JWT Supabase est un HS256 avec exp
    // On décode le payload (base64) sans vérifier la signature côté client
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        // Token expiré
        clearToken();
        localStorage.removeItem("currentAdmin");
        navigate("/login");
      }
    } catch {
      // Token malformé
      clearToken();
      localStorage.removeItem("currentAdmin");
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}