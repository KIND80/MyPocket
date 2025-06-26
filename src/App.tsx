import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import DashboardAdmin from "./DashboardAdmin";
import AgentHome from "./AgentHome";
import SignupCompany from "./SignupCompany";
import LandingPage from "./LandingPage";
import ResetPassword from "./ResetPassword";

// --- ProtectedRoute : Sécurise toutes les routes sensibles
function ProtectedRoute({
  children,
  role,
  allowedRoles,
}: {
  children: React.ReactNode;
  role: string | null;
  allowedRoles: string[];
}) {
  let content = children;
  if (!role) {
    content = <Navigate to="/login" replace />;
  } else if (!allowedRoles.includes(role)) {
    content = <Navigate to="/unauthorized" replace />;
  }
  return <>{content}</>;
}

export default function App() {
  const [role, setRole] = useState<"admin" | "agent" | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      if (user?.id) {
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        const cleanRole =
          typeof userData?.role === "string" ? userData.role.trim() : null;

        if (cleanRole === "admin" || cleanRole === "agent") {
          setRole(cleanRole);
          setUserId(user.id);
        } else {
          setRole(null);
          setUserId("");
        }
      } else {
        setRole(null);
        setUserId("");
      }
      setLoading(false);
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          setRole(null);
          setUserId("");
          navigate("/login");
        } else {
          checkSession();
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line
  }, []);

  // Redirection automatique seulement depuis /login si déjà connecté
  useEffect(() => {
    if (
      location.pathname === "/reset-password" ||
      location.pathname === "/signup-company"
    ) {
      return;
    }
    if (!loading && role === "admin" && location.pathname === "/login") {
      navigate("/admin", { replace: true });
    }
    if (!loading && role === "agent" && location.pathname === "/login") {
      navigate("/agent", { replace: true });
    }
    // eslint-disable-next-line
  }, [role, loading, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#e6eef8] via-[#fdf6ee] to-[#f4eee8]">
        <div className="flex flex-col items-center gap-4">
          {/* Remplace le src du logo par ton logo ou une icône si tu veux */}
          <img
            src="/logo.svg"
            alt="Logo MyPocket"
            className="h-16 animate-pulse"
          />
          <h2 className="text-2xl font-bold text-[#235ea6] tracking-tight">
            Chargement de votre espace...
          </h2>
          <div className="text-[#174073] opacity-80">
            Préparez-vous à booster votre productivité 🚀
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e6eef8] via-[#fdf6ee] to-[#f4eee8] font-sans transition-all">
      <Routes>
        {/* 🚀 Landing page marketing */}
        <Route path="/" element={<LandingPage role={role} />} />

        {/* Inscription société (publique) */}
        <Route path="/signup-company" element={<SignupCompany />} />

        {/* Login : toujours accessible */}
        <Route
          path="/login"
          element={
            <Login
              onLogin={(r, id) => {
                setRole(r.trim() as "admin" | "agent");
                setUserId(id);
              }}
              role={role}
            />
          }
        />

        {/* Reset password - accessible sans être connecté */}
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Routes admin protégées */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role={role} allowedRoles={["admin"]}>
              <DashboardAdmin userId={userId} />
            </ProtectedRoute>
          }
        />

        {/* Routes agent protégées */}
        <Route
          path="/agent"
          element={
            <ProtectedRoute role={role} allowedRoles={["agent"]}>
              <AgentHome agentId={userId} />
            </ProtectedRoute>
          }
        />

        {/* Page non autorisée */}
        <Route
          path="/unauthorized"
          element={
            <div className="flex h-screen items-center justify-center bg-[#f4eee8]">
              <div className="text-[#d7263d] text-2xl font-bold bg-white rounded-2xl px-8 py-6 shadow-xl flex flex-col items-center gap-2 border border-[#ffd3c5]">
                <span>⛔</span>
                Accès refusé
                <br />
                <span className="text-sm font-normal text-[#235ea6] opacity-70">
                  Vous n'avez pas les droits d’accès à cette page
                </span>
              </div>
            </div>
          }
        />

        {/* Catch-all : Redirige vers /login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}
