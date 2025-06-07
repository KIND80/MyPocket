import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import AppelContact from "./AppelContact";
import PortefeuilleAgent from "./PortefeuilleAgent";

type AgentStat = {
  id: string;
  name: string;
  total_appels: number;
  rdvs: number;
};

export default function AgentHome({ agentId }: { agentId: string }) {
  const [onglet, setOnglet] = useState<"global" | "mes_contacts">("global");
  const [prenom, setPrenom] = useState<string>("");
  const [stats, setStats] = useState<{ appels: number; rdvs: number }>({
    appels: 0,
    rdvs: 0,
  });
  const [classement, setClassement] = useState<AgentStat[]>([]);

  useEffect(() => {
    const fetchPrenom = async () => {
      const { data } = await supabase
        .from("users")
        .select("prenom")
        .eq("id", agentId)
        .single();
      if (data?.prenom) setPrenom(data.prenom);
    };

    const fetchStats = async () => {
      const startOfWeek = getStartOfWeek();

      const { data: appels } = await supabase
        .from("call_history")
        .select("*")
        .eq("agent_id", agentId)
        .gte("date", startOfWeek);

      const { data: rdvs } = await supabase
        .from("call_history")
        .select("*")
        .eq("agent_id", agentId)
        .eq("statut_appel", "RDV")
        .gte("date", startOfWeek);

      console.log("📞 Appels récupérés :", appels);
      console.log("📅 RDVs récupérés :", rdvs);

      setStats({ appels: appels?.length || 0, rdvs: rdvs?.length || 0 });
    };

    const fetchClassement = async () => {
      const { data } = await supabase.rpc("classement_agents_semaine");
      if (data) setClassement(data);
      console.log("🏆 Classement récupéré :", data);
    };

    fetchPrenom();
    fetchStats();
    fetchClassement();
  }, [agentId]);

  const getStartOfWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split("T")[0];
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert("Erreur de déconnexion : " + error.message);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 font-sans">
      {/* Header */}
      <div className="flex flex-col items-center mb-6 gap-2 text-center">
        <h1 className="text-2xl font-bold text-gray-800">
          👋 Bonjour {prenom || "Agent"}
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold"
        >
          🔒 Se déconnecter
        </button>
      </div>

      {/* Onglets */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setOnglet("global")}
          className={`px-4 py-2 rounded font-semibold ${
            onglet === "global" ? "bg-green-600 text-white" : "bg-gray-200"
          }`}
        >
          📂 Portefeuille Global
        </button>
        <button
          onClick={() => setOnglet("mes_contacts")}
          className={`px-4 py-2 rounded font-semibold ${
            onglet === "mes_contacts" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          📁 Mes Contacts
        </button>
      </div>

      {/* Main content */}
      <div>
        {onglet === "global" ? (
          <AppelContact agentId={agentId} />
        ) : (
          <PortefeuilleAgent agentId={agentId} />
        )}
      </div>

      {/* Stats, Classement, Contact */}
      {onglet === "mes_contacts" && (
        <div className="mt-10">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {/* Statistiques */}
            <div className="min-w-[260px] bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-700 mb-2">
                📊 Statistiques
              </h3>
              <p>📞 Appels : {stats.appels}</p>
              <p>✅ RDVs : {stats.rdvs}</p>
            </div>

            {/* Classement */}
            <div className="min-w-[260px] bg-purple-50 border border-purple-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-purple-700 mb-2">
                🏆 Classement
              </h3>
              {classement.length === 0 ? (
                <p>Chargement...</p>
              ) : (
                classement.map((agent, index) => (
                  <p key={agent.id} className="text-sm">
                    {index + 1}. {agent.name} — {agent.total_appels} appels /{" "}
                    {agent.rdvs} RDV
                  </p>
                ))
              )}
            </div>

            {/* Nous contacter */}
            <div className="min-w-[260px] bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-yellow-700 mb-2">
                📧 Nous contacter
              </h3>
              <p className="text-sm">
                Une question ?{" "}
                <a
                  href="mailto:contact@monfideleconseiller.com"
                  className="text-blue-500 underline"
                >
                  contact@monfideleconseiller.com
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
