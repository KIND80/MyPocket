import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import AppelContact from "./AppelContact";
import PortefeuilleAgent from "./PortefeuilleAgent";
import { motion } from "framer-motion";

type AgentStat = {
  id: string;
  name: string;
  total_appels: number;
  rdvs: number;
};

export default function AgentHome({ agentId }: { agentId: string }) {
  const [onglet, setOnglet] = useState<"global" | "mes_contacts">("global");
  const [prenom, setPrenom] = useState<string>("");
  const [nom, setNom] = useState<string>("");
  const [stats, setStats] = useState<{
    appels: number;
    rdvs: number;
    signatures: number;
    taux_signature: number;
  }>({
    appels: 0,
    rdvs: 0,
    signatures: 0,
    taux_signature: 0,
  });
  const [classement, setClassement] = useState<AgentStat[]>([]);

  useEffect(() => {
    const fetchNomPrenom = async () => {
      const { data } = await supabase
        .from("users")
        .select("prenom, nom")
        .eq("id", agentId)
        .single();
      if (data?.prenom) setPrenom(data.prenom);
      if (data?.nom) setNom(data.nom);
    };

    const fetchStats = async () => {
      const startOfWeek = getStartOfWeek();

      const { data: appels } = await supabase
        .from("call_history")
        .select("*")
        .eq("agent_id", agentId)
        .gte("date", startOfWeek);

      const { data: contactsRdv } = await supabase
        .from("contacts")
        .select("*")
        .eq("agent_id", agentId)
        .eq("statut", "rdv");

      const signatures = (appels || []).filter(
        (a) =>
          (a.commentaire &&
            a.commentaire.toLowerCase().includes("signature")) ||
          (a.statut_appel && a.statut_appel.toLowerCase().includes("signature"))
      ).length;

      const nbAppels = appels?.length || 0;
      const taux_signature = nbAppels > 0 ? (signatures / nbAppels) * 100 : 0;

      setStats({
        appels: nbAppels,
        rdvs: contactsRdv?.length || 0,
        signatures,
        taux_signature,
      });
    };

    const fetchClassement = async () => {
      const { data } = await supabase.rpc("classement_agents_semaine");
      if (data) setClassement(data);
    };

    fetchNomPrenom();
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

  // 💎 PALETTE
  // Bleu pastel: #e6eef8
  // Bleu accent: #235ea6
  // Beige soft: #fdf6ee / #f4eee8
  // Jaune doux: #fcbf49

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf6ee] via-[#e6eef8] to-[#f4eee8] font-sans transition-all">
      {/* Header */}
      <motion.div
        className="w-full rounded-b-2xl bg-[#235ea6] text-white shadow-lg mb-10"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 60 }}
      >
        <div className="flex flex-col md:flex-row items-center md:justify-between px-6 py-8 max-w-5xl mx-auto">
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-3xl font-bold mb-1 tracking-tight">
              👋 Bonjour {prenom || nom ? `${prenom} ${nom}` : "Agent"}
            </h1>
            <div className="opacity-80 text-lg">
              Prêt à faire la différence cette semaine&nbsp;?
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 md:mt-0 bg-[#fcbf49] hover:bg-[#f1ac0c] text-[#235ea6] font-bold px-6 py-2 rounded-xl shadow transition"
          >
            🔒 Se déconnecter
          </button>
        </div>
      </motion.div>

      {/* Onglets */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setOnglet("global")}
          className={`px-6 py-2 text-lg rounded-full font-semibold shadow transition
            ${
              onglet === "global"
                ? "bg-[#235ea6] text-white scale-105"
                : "bg-white/80 text-[#235ea6] border border-[#235ea6] hover:bg-[#e6eef8]"
            }
          `}
        >
          📂 Portefeuille Global
        </button>
        <button
          onClick={() => setOnglet("mes_contacts")}
          className={`px-6 py-2 text-lg rounded-full font-semibold shadow transition
            ${
              onglet === "mes_contacts"
                ? "bg-[#fcbf49] text-[#235ea6] scale-105"
                : "bg-white/80 text-[#fcbf49] border border-[#fcbf49] hover:bg-[#f6eee0]"
            }
          `}
        >
          📁 Mes Contacts
        </button>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto">
        <motion.div
          key={onglet}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 50 }}
        >
          {onglet === "global" ? (
            <AppelContact agentId={agentId} />
          ) : (
            <PortefeuilleAgent agentId={agentId} />
          )}
        </motion.div>
      </div>

      {/* Stats, Classement, Contact */}
      {onglet === "mes_contacts" && (
        <motion.div
          className="mt-12 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex gap-6 overflow-x-auto pb-4">
            {/* Statistiques */}
            <StatBlock
              bg="bg-[#e6eef8]"
              border="border-blue-200"
              title="📊 Statistiques"
              titleColor="text-[#235ea6]"
            >
              <p>
                📞 Appels : <b>{stats.appels}</b>
              </p>
              <p>
                ✅ RDVs : <b>{stats.rdvs}</b>
              </p>
              <p>
                ✍️ Signatures : <b>{stats.signatures}</b>
              </p>
              <p>
                Taux de signature :{" "}
                <span className="font-bold">
                  {stats.taux_signature.toFixed(1)}%
                </span>
              </p>
            </StatBlock>

            {/* Classement */}
            <StatBlock
              bg="bg-[#fdf6ee]"
              border="border-[#fcbf49]"
              title="🏆 Classement"
              titleColor="text-[#fcbf49]"
            >
              {classement.length === 0 ? (
                <p>Chargement...</p>
              ) : (
                classement.map((agent, index) => (
                  <p key={agent.id} className="text-sm">
                    <span
                      className={`font-semibold ${
                        index === 0 ? "text-[#235ea6]" : ""
                      }`}
                    >
                      {index + 1}. {agent.name}
                    </span>
                    {" — "}
                    <span>
                      {agent.total_appels} appels / {agent.rdvs} RDV
                    </span>
                  </p>
                ))
              )}
            </StatBlock>

            {/* Nous contacter */}
            <StatBlock
              bg="bg-[#f6eee0]"
              border="border-yellow-200"
              title="📧 Nous contacter"
              titleColor="text-yellow-700"
            >
              <p className="text-sm">
                Une question&nbsp;?{" "}
                <a
                  href="mailto:contact@monfideleconseiller.com"
                  className="text-[#235ea6] underline"
                >
                  contact@monfideleconseiller.com
                </a>
              </p>
            </StatBlock>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Bloc stat stylé, réutilisable
function StatBlock({
  bg,
  border,
  title,
  titleColor,
  children,
}: {
  bg: string;
  border: string;
  title: string;
  titleColor: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`min-w-[260px] ${bg} border ${border} rounded-2xl p-5 shadow flex flex-col gap-2 transition-all`}
    >
      <div className={`text-lg font-bold mb-2 ${titleColor}`}>{title}</div>
      <div className="flex flex-col gap-1">{children}</div>
    </motion.div>
  );
}
