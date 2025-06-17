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

        // Correction : on retire les espaces et retours à la ligne
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

  // === LOGS DE DEBUG pour observer tout le flow ===
  useEffect(() => {
    console.log("DEBUG [App] REDIRECT EFFECT", {
      loading,
      role,
      pathname: location.pathname,
    });
    if (
      !loading &&
      role === "admin" &&
      (location.pathname === "/login" || location.pathname === "/")
    ) {
      //console.log("DEBUG [App] REDIRECT -> /admin");
      navigate("/admin", { replace: true });
    }
    if (
      !loading &&
      role === "agent" &&
      (location.pathname === "/login" || location.pathname === "/")
    ) {
      //console.log("DEBUG [App] REDIRECT -> /agent");
      navigate("/agent", { replace: true });
    }
    // eslint-disable-next-line
  }, [role, loading, location.pathname]);

  // Log avant le rendu
  console.log("DEBUG [App] AVANT RETURN", {
    loading,
    role,
    pathname: location.pathname,
  });

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <h2 className="text-lg font-semibold text-gray-600">
          Chargement en cours...
        </h2>
      </div>
    );
  }

  return (
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
              // Log pour voir la callback
              //console.log("DEBUG [App] onLogin callback", r, id);
            }}
            role={role}
          />
        }
      />

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
          <div className="flex h-screen items-center justify-center text-red-600 text-xl font-bold">
            Accès refusé 😕
          </div>
        }
      />

      {/* Catch-all : Redirige vers /login */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
