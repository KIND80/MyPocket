import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import DashboardAdmin from "./DashboardAdmin";
import AgentHome from "./AgentHome";
import SignupCompany from "./SignupCompany"; // Ton nouveau composant

export default function App() {
  const [role, setRole] = useState<"admin" | "agent" | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

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

        if (userData?.role === "admin" || userData?.role === "agent") {
          setRole(userData.role);
          setUserId(user.id);
        } else {
          setRole(null);
        }
      }

      setLoading(false);
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setRole(null);
        setUserId("");
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <h2 className="text-lg font-semibold text-gray-600">Chargement en cours...</h2>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Page d'inscription société accessible publiquement */}
        <Route path="/signup-company" element={<SignupCompany />} />

        {/* Si utilisateur non connecté, affiche le Login */}
        {!role && (
          <>
            <Route
              path="/login"
              element={
                <Login
                  onLogin={(r, id) => {
                    setRole(r as "admin" | "agent");
                    setUserId(id);
                  }}
                />
              }
            />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        )}

        {/* Routes protégées si connecté */}
        {role === "admin" && (
          <>
            <Route path="/admin" element={<DashboardAdmin />} />
            <Route path="*" element={<Navigate to="/admin" />} />
          </>
        )}

        {role === "agent" && (
          <>
            <Route path="/agent" element={<AgentHome agentId={userId} />} />
            <Route path="*" element={<Navigate to="/agent" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}
