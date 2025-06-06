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
  const [stats, setStats] = useState<{ appels: number; rdvs: number }>({ appels: 0, rdvs: 0 });
  const [classement, setClassement] = useState<AgentStat[]>([]);

  useEffect(() => {
    const fetchPrenom = async () => {
      const { data } = await supabase.from("users").select("prenom").eq("id", agentId).single();
      if (data?.prenom) setPrenom(data.prenom);
    };

    const fetchStats = async () => {
      const { data: appels } = await supabase
        .from("appels")
        .select("*", { count: "exact" })
        .eq("agent_id", agentId)
        .gte("date", getStartOfWeek());

      const { data: rdvs } = await supabase
        .from("appels")
        .select("*", { count: "exact" })
        .eq("agent_id", agentId)
        .eq("type", "rdv")
        .gte("date", getStartOfWeek());

      setStats({
        appels: appels?.length || 0,
        rdvs: rdvs?.length || 0,
      });
    };

    const fetchClassement = async () => {
      const { data } = await supabase.rpc("classement_agents_semaine");
      if (data) {
        setClassement(data);
      }
    };

    fetchPrenom();
    fetchStats();
    fetchClassement();
  }, [agentId]);

  const getStartOfWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // lundi
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split("T")[0];
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Erreur lors de la déconnexion : " + error.message);
    }
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "20px",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      <header
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: 30,
        }}
      >
        <h1 style={{ fontSize: "1.8rem", marginBottom: 10 }}>
          👋 Bonjour {prenom || "Agent"}
        </h1>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "#f44336",
            color: "#fff",
            border: "none",
            padding: "10px 16px",
            borderRadius: 5,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          🔒 Se déconnecter
        </button>
      </header>

      <nav
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: 30,
        }}
      >
        <button
          onClick={() => setOnglet("global")}
          style={{
            flex: "1 1 150px",
            padding: 12,
            backgroundColor: onglet === "global" ? "#4CAF50" : "#eee",
            color: onglet === "global" ? "#fff" : "#000",
            border: "none",
            borderRadius: 6,
            fontWeight: "bold",
          }}
        >
          📂 Portefeuille Global
        </button>

        <button
          onClick={() => setOnglet("mes_contacts")}
          style={{
            flex: "1 1 150px",
            padding: 12,
            backgroundColor: onglet === "mes_contacts" ? "#2196F3" : "#eee",
            color: onglet === "mes_contacts" ? "#fff" : "#000",
            border: "none",
            borderRadius: 6,
            fontWeight: "bold",
          }}
        >
          📁 Mes Contacts
        </button>
      </nav>

      <main>
        {onglet === "global" ? (
          <AppelContact agentId={agentId} />
        ) : (
          <PortefeuilleAgent agentId={agentId} />
        )}
      </main>

      {onglet === "mes_contacts" && (
        <section style={{ marginTop: 40 }}>
          <div style={{ overflowX: "auto", whiteSpace: "nowrap" }}>
            <div
              style={{
                display: "inline-block",
                minWidth: 280,
                padding: 16,
                marginRight: 12,
                border: "1px solid #ddd",
                borderRadius: 6,
                backgroundColor: "#f0f9ff",
              }}
            >
              <h3>📊 Statistiques de la semaine</h3>
              <p>📞 Appels : {stats.appels}</p>
              <p>✅ RDV : {stats.rdvs}</p>
            </div>

            <div
              style={{
                display: "inline-block",
                minWidth: 280,
                padding: 16,
                marginRight: 12,
                border: "1px solid #ddd",
                borderRadius: 6,
                backgroundColor: "#f9f0ff",
              }}
            >
              <h3>🏆 Classement des agents</h3>
              {classement.length === 0 ? (
                <p>Chargement...</p>
              ) : (
                classement.map((agent, index) => (
                  <p key={agent.id}>
                    {index + 1}. {agent.name} ({agent.total_appels} appels / {agent.rdvs} RDV)
                  </p>
                ))
              )}
            </div>

            <div
              style={{
                display: "inline-block",
                minWidth: 280,
                padding: 16,
                border: "1px solid #ddd",
                borderRadius: 6,
                backgroundColor: "#fff9f0",
              }}
            >
              <h3>📧 Nous contacter</h3>
              <p>
                Une question ?{" "}
                <a href="mailto:contact@monfideleconseiller.com">
                  contact@monfideleconseiller.com
                </a>
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
