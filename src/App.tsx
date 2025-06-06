import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import DashboardAdmin from "./DashboardAdmin";
import AgentHome from "./AgentHome";

export default function App() {
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();

        setRole(userData?.role || null);
        setUserId(session.user.id);
      }
      setLoading(false);
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          setRole(null);
          setUserId("");
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          paddingTop: 100,
          textAlign: "center",
          fontFamily: "Arial",
        }}
      >
        <h2>Chargement en cours...</h2>
      </div>
    );
  }

  if (!role) {
    return (
      <Login
        onLogin={(r, id) => {
          setRole(r);
          setUserId(id);
        }}
      />
    );
  }

  if (role === "admin") {
    return <DashboardAdmin />;
  }

  if (role === "agent") {
    return <AgentHome agentId={userId} />;
  }

  return (
    <div
      style={{
        paddingTop: 100,
        textAlign: "center",
        fontFamily: "Arial",
        maxWidth: 600,
        margin: "0 auto",
      }}
    >
      <h2>⛔ Rôle inconnu ou non autorisé</h2>
      <p>Merci de contacter un administrateur si vous pensez que c’est une erreur.</p>
    </div>
  );
}