import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import AppelContact from "./AppelContact";
import PortefeuilleAgent from "./PortefeuilleAgent";

export default function AgentHome({ agentId }: { agentId: string }) {
  const [onglet, setOnglet] = useState<"global" | "mes_contacts">("global");

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
          👤 Espace Agent
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
    </div>
  );
}
