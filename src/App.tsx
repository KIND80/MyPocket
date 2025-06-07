import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import DashboardAdmin from "./DashboardAdmin";
import AgentHome from "./AgentHome";

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

  if (!role) {
    return (
      <Login
        onLogin={(r, id) => {
          setRole(r as "admin" | "agent");
          setUserId(id);
        }}
      />
    );
  }

  if (role === "admin") return <DashboardAdmin />;
  if (role === "agent") return <AgentHome agentId={userId} />;

  return (
    <div className="h-screen flex flex-col items-center justify-center text-center px-4">
      <h2 className="text-xl font-bold text-red-600 mb-2">⛔ Rôle inconnu</h2>
      <p className="text-gray-600">
        Merci de contacter un administrateur si vous pensez que c’est une erreur.
      </p>
    </div>
  );
}
