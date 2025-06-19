import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import AjouterContact from "./AjouterContact";
import ImportCSV from "./ImportCSV";
import GestionAgents from "./GestionAgents";

// Types
type AgentStat = {
  id: string;
  name: string;
  email: string;
  total_appels: number;
  signatures: number;
  non_signatures: number;
  a_valider: number;
  taux_signature: number;
};

type Contact = {
  id: string;
  nom: string;
  telephone: string;
  adresse?: string;
  npa?: string;
  agent_id: string;
  rdv_date: string;
  statut: string;
  agent?: { id: string; name: string; email: string };
};

type Appel = {
  id: string;
  contact_id: string;
  agent_id: string;
  date: string;
  commentaire: string | null;
  statut_appel: string;
  admin_validation?: string | null;
  agent?: { name?: string; email?: string };
};

type Agent = {
  id: string;
  name: string;
  email: string;
};

type DashboardAdminProps = {
  userId: string;
};

const tabs = [
  { key: "contacts", label: "👥 Contacts" },
  { key: "agents", label: "🧑‍💼 Agents" },
  { key: "stats", label: "📊 Statistiques & validations" },
];

export default function DashboardAdmin({ userId }: DashboardAdminProps) {
  const [stats, setStats] = useState<AgentStat[]>([]);
  const [contactsAValider, setContactsAValider] = useState<Contact[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [appelHistory, setAppelHistory] = useState<Appel[]>([]);
  const [activeTab, setActiveTab] = useState<"contacts" | "agents" | "stats">(
    "stats"
  );
  const [userName, setUserName] = useState<string>("");
  const [companyId, setCompanyId] = useState<string>("");

  // 1. Chargement de l'utilisateur pour récupérer le companyId
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) {
        console.error("Erreur récupération utilisateur :", error.message);
      } else {
        setUserName(data?.name || data?.prenom || "Admin");
        setCompanyId(data?.company_id || "");
      }
    };
    fetchUser();
  }, []);

  // 2. Chargement des données de la société courante
  useEffect(() => {
    if (!companyId) return;
    const fetchData = async () => {
      // AGENTS de la société
      const { data: users } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("role", "agent")
        .eq("company_id", companyId);

      // HISTORIQUE d'appels filtré sur company
      const { data: calls } = await supabase
        .from("call_history")
        .select("*, agent:agent_id (name, email)")
        .eq("company_id", companyId)
        .order("date", { ascending: false });

      // CONTACTS de la société
      const { data: contactsData } = await supabase
        .from("contacts")
        .select("*, agent:agent_id (id, name, email)")
        .eq("company_id", companyId);

      if (!users || !calls || !contactsData) return;

      const finalStats: AgentStat[] = users.map((agent) => {
        const appels = calls.filter((c) => c.agent_id === agent.id);
        const total_appels = appels.length;

        const signatures = appels.filter(
          (a) =>
            a.statut_appel === "signature" && a.admin_validation === "validée"
        ).length;
        const non_signatures = appels.filter(
          (a) =>
            a.statut_appel === "non_signature" &&
            (a.admin_validation === "validée" || a.admin_validation == null)
        ).length;

        const a_valider = contactsData.filter(
          (c) => c.agent_id === agent.id && c.statut === "à_valider"
        ).length;

        const taux_signature =
          total_appels > 0 ? (signatures / total_appels) * 100 : 0;

        return {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          total_appels,
          signatures,
          non_signatures,
          a_valider,
          taux_signature,
        };
      });

      setStats(finalStats);
      setAgents(users);
      setAppelHistory(calls);
      setContacts(contactsData);
      setContactsAValider(contactsData.filter((c) => c.statut === "à_valider"));
    };

    fetchData();
  }, [companyId]);

  // 3. Fonctions de validation des contacts
  const validerContact = async (id: string, agentId: string) => {
    await supabase
      .from("contacts")
      .update({
        statut: "assigné",
        agent_id: agentId,
        visible_globally: false,
      })
      .eq("id", id);

    await supabase.rpc("update_latest_call_validation", {
      contact_id_input: id,
      validation_status: "validée",
    });

    setContactsAValider((prev) => prev.filter((c) => c.id !== id));
  };

  const archiverContact = async (id: string) => {
    await supabase
      .from("contacts")
      .update({
        statut: "non_assigné",
        agent_id: null,
        rdv_date: null,
        visible_globally: true,
      })
      .eq("id", id);

    await supabase.rpc("update_latest_call_validation", {
      contact_id_input: id,
      validation_status: "refusée",
    });

    setContactsAValider((prev) => prev.filter((c) => c.id !== id));
  };

  const topPerformers = [...stats]
    .sort((a, b) => b.taux_signature - a.taux_signature)
    .slice(0, 3);

  // Helper pour les médailles
  const medal = (i: number) =>
    i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";

  // Liste des RDV à venir
  const today = new Date();
  const rdvsAVenir = contacts
    .filter(
      (c) => c.statut === "rdv" && c.rdv_date && new Date(c.rdv_date) > today
    )
    .sort(
      (a, b) => new Date(a.rdv_date).getTime() - new Date(b.rdv_date).getTime()
    );

  // Stats RDV à venir PAR AGENT
  const rdvsParAgent = agents
    .map((agent) => ({
      ...agent,
      rdv_count: rdvsAVenir.filter((c) => c.agent_id === agent.id).length,
    }))
    .filter((a) => a.rdv_count > 0);

  return (
    <div className="max-w-6xl mx-auto p-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-7">
        <div className="flex items-center gap-3">
          <img
            src="https://api.dicebear.com/7.x/pixel-art/svg?seed=John"
            alt=""
            className="w-12 h-12 rounded-full bg-white p-2 shadow"
          />
          <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-200">
            👑 Tableau de bord Admin — Bonjour {userName}
          </h1>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl shadow font-bold flex items-center gap-1 transition"
        >
          🔒 Déconnexion
        </button>
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap gap-3 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl font-semibold shadow transition
              ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white scale-105"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-blue-100"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ONGLET 1 : Contacts */}
      {activeTab === "contacts" && (
        <div className="space-y-8">
          {!companyId && (
            <div className="text-red-600 font-semibold text-center">
              ⚠️ Aucune société sélectionnée. Merci de configurer un companyId
              pour cet utilisateur admin.
            </div>
          )}
          {companyId && (
            <>
              {/* Import CSV */}
              <section>
                <h2 className="text-lg font-bold mb-3 text-green-700 flex items-center gap-2">
                  📥 Import CSV
                </h2>
                <ImportCSV entrepriseId={companyId} onSuccess={() => {}} />
              </section>

              {/* Ajouter un contact */}
              <section>
                <h2 className="text-lg font-bold mb-3 text-purple-700 flex items-center gap-2">
                  ➕ Ajouter un contact
                </h2>
                <AjouterContact entrepriseId={companyId} onSuccess={() => {}} />
              </section>
            </>
          )}
        </div>
      )}

      {/* ONGLET 2 : Agents */}
      {activeTab === "agents" && <GestionAgents companyId={companyId || ""} />}

      {/* ONGLET 3 : Statistiques & validations */}
      {activeTab === "stats" && (
        <>
          {/* TOP 3 Agents */}
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-blue-700 flex items-center gap-2">
              🏆 Top 3 Agents par taux de signature
            </h2>
            <div className="flex flex-wrap gap-6">
              {topPerformers.length === 0 ? (
                <p className="text-gray-500">Aucun agent disponible.</p>
              ) : (
                topPerformers.map((agent, i) => (
                  <div
                    key={agent.id}
                    className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-2xl p-5 shadow w-full sm:w-80 flex flex-col gap-2 items-center"
                  >
                    <div className="text-3xl">{medal(i)}</div>
                    <div className="text-lg font-bold">{agent.name}</div>
                    <div className="text-gray-600 dark:text-gray-200">
                      {agent.email}
                    </div>
                    <div>
                      <span className="font-semibold">Taux de signature :</span>{" "}
                      <span className="text-blue-600 font-bold">
                        {agent.taux_signature.toFixed(1)}%
                      </span>
                    </div>
                    <div>Appels : {agent.total_appels}</div>
                    <div>À valider : {agent.a_valider}</div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* ====== RDV à venir : stats et tableau ====== */}
          <section className="mb-8">
            <div className="flex items-center mb-2">
              <h2 className="text-xl font-bold text-blue-700 flex items-center gap-2">
                📅 RDV à venir
              </h2>
              <span className="ml-3 inline-block bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-md font-bold">
                {rdvsAVenir.length} au total
              </span>
            </div>
            {rdvsParAgent.length > 0 && (
              <ul className="flex flex-wrap gap-3 mb-4">
                {rdvsParAgent.map((a) => (
                  <li
                    key={a.id}
                    className="bg-blue-50 dark:bg-blue-900 rounded-lg px-4 py-2 shadow text-blue-900 dark:text-blue-100 font-semibold"
                  >
                    {a.name} :{" "}
                    <span className="text-blue-700 dark:text-blue-300">
                      {a.rdv_count}
                    </span>{" "}
                    RDV
                  </li>
                ))}
              </ul>
            )}

            {rdvsAVenir.length === 0 ? (
              <p className="text-gray-500">Aucun RDV à venir.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-left bg-white dark:bg-gray-900 border rounded-xl shadow">
                  <thead>
                    <tr className="bg-blue-100 dark:bg-blue-900">
                      <th className="py-2 px-4">Contact</th>
                      <th className="py-2 px-4">Agent</th>
                      <th className="py-2 px-4">Date RDV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rdvsAVenir.map((c) => (
                      <tr key={c.id} className="border-t">
                        <td className="py-2 px-4">{c.nom}</td>
                        <td className="py-2 px-4">{c.agent?.name || "—"}</td>
                        <td className="py-2 px-4">
                          {c.rdv_date
                            ? new Date(c.rdv_date).toLocaleString("fr-FR")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Contacts à valider */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-purple-700 flex items-center gap-2">
              📌 Contacts à valider
            </h2>
            {contactsAValider.length === 0 ? (
              <p className="text-gray-500">Aucun contact à valider.</p>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {contactsAValider.map((c) => {
                  const dernierAppel = appelHistory.find(
                    (a) => a.contact_id === c.id && a.commentaire
                  );
                  return (
                    <li
                      key={c.id}
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow flex flex-col gap-2"
                    >
                      <div className="text-lg font-bold">
                        {c.nom} —{" "}
                        <span className="text-blue-600">{c.telephone}</span>
                      </div>
                      <div>
                        <span className="font-semibold">🏠 Adresse :</span>{" "}
                        {c.adresse || "—"} {c.npa || ""}
                      </div>
                      <div>
                        <span className="font-semibold">📅 RDV :</span>{" "}
                        {c.rdv_date
                          ? new Date(c.rdv_date).toLocaleDateString("fr-FR")
                          : "Non défini"}
                      </div>
                      <div>
                        <span className="font-semibold">👤 Agent :</span>{" "}
                        {c.agent?.name || "—"} ({c.agent?.email || "—"})
                      </div>
                      {dernierAppel && (
                        <div className="italic text-gray-500 dark:text-gray-300">
                          📝 {dernierAppel.commentaire}
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => validerContact(c.id, c.agent_id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition"
                        >
                          ✅ Valider
                        </button>
                        <button
                          onClick={() => archiverContact(c.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold shadow transition"
                        >
                          ❌ Refuser
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Historique par agent avec SCROLL */}
          <section className="mt-10">
            <h2 className="text-xl font-bold mb-4 text-blue-700">
              📄 Historique des validations par agent
            </h2>
            <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
              {agents.map((agent) => {
                const historiques = appelHistory.filter(
                  (a) => a.agent_id === agent.id && a.commentaire
                );
                if (historiques.length === 0) return null;
                return (
                  <div
                    key={agent.id}
                    className="bg-gray-50 dark:bg-gray-800 border border-blue-400 dark:border-blue-700 rounded-2xl p-5 shadow"
                  >
                    {/* Bloc titre agent plus visible */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-xl font-bold text-blue-800 dark:text-blue-200">
                        👤 {agent.name}
                      </div>
                      <div className="text-sm text-blue-500 dark:text-blue-300">
                        ({agent.email})
                      </div>
                    </div>
                    <ul className="list-disc ml-5 space-y-1 text-gray-800 dark:text-gray-200">
                      {historiques.map((h) => (
                        <li key={h.id}>
                          <span className="font-semibold">
                            {new Date(h.date).toLocaleString("fr-FR")}
                          </span>{" "}
                          — 🗣️ <span>{h.commentaire}</span>
                          {h.statut_appel && (
                            <span className="ml-2 text-xs italic text-blue-600">
                              [{h.statut_appel}]
                            </span>
                          )}
                          {typeof h.admin_validation === "string" && (
                            <span className="ml-2 text-xs italic text-green-600">
                              ({h.admin_validation})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
