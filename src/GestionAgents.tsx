import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

type Agent = {
  id: string;
  email: string;
  name?: string;
  active?: boolean;
};

export default function GestionAgents({ companyId }: { companyId: string }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchAgents();
    // eslint-disable-next-line
  }, [companyId]);

  const fetchAgents = async () => {
    if (!companyId) {
      setAgents([]);
      setMessage("Aucune société sélectionnée !");
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, active")
      .eq("company_id", companyId)
      .eq("role", "agent");

    if (error) {
      setMessage("❌ Erreur chargement agents");
      setAgents([]);
    } else {
      setAgents(data || []);
      setMessage("");
    }
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data: exists } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .eq("company_id", companyId)
      .maybeSingle();

    if (exists) {
      setMessage("❌ Cet email est déjà un agent de la société !");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("users").insert({
      email,
      name,
      company_id: companyId,
      role: "agent",
      active: true,
    });

    if (error) {
      setMessage("❌ Erreur ajout agent");
    } else {
      setMessage(
        "✅ Agent ajouté ! Pour activer le compte, l’agent doit cliquer sur « Mot de passe oublié » sur la page de connexion."
      );
      setEmail("");
      setName("");
      fetchAgents();
    }
    setLoading(false);
  };

  const handleDeleteAgent = async (id: string) => {
    if (!window.confirm("Confirmer suppression de cet agent ?")) return;

    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      setMessage("❌ Erreur suppression");
    } else {
      setMessage("✅ Agent supprimé");
      fetchAgents();
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 bg-gradient-to-br from-[#fdf6ee] to-[#e6eef8] rounded-3xl shadow-xl p-8 font-sans animate-fade-in-up">
      {/* Header avec icône */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-br from-blue-200 to-purple-200 rounded-full p-3 shadow">
          <span className="text-2xl">👥</span>
        </div>
        <h2 className="text-3xl font-extrabold text-blue-900">
          Gestion des agents
        </h2>
      </div>

      {/* Formulaire d'ajout */}
      <form
        className="flex flex-col sm:flex-row gap-2 mb-7"
        onSubmit={handleAddAgent}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email de l'agent"
          required
          className="border rounded-xl px-4 py-2 flex-1 shadow-sm focus:ring-2 focus:ring-blue-400 outline-none"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de l'agent"
          required
          className="border rounded-xl px-4 py-2 flex-1 shadow-sm focus:ring-2 focus:ring-blue-400 outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-xl shadow transition text-lg"
        >
          {loading ? <span className="animate-spin">⏳</span> : "➕ Ajouter"}
        </button>
      </form>

      {/* Message info */}
      {message && (
        <div
          className={`text-center mb-4 font-semibold ${
            message.startsWith("✅")
              ? "text-green-600 animate-fade-in"
              : "text-red-600 animate-shake"
          }`}
        >
          {message}
        </div>
      )}

      {/* Tableau responsive */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow">
          <thead className="bg-[#235ea6] text-white">
            <tr>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Nom</th>
              <th className="px-4 py-2 text-left">Statut</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {agents.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-400">
                  Aucun agent pour l’instant.
                </td>
              </tr>
            ) : (
              agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-blue-50 transition">
                  <td className="px-4 py-2 font-mono">{agent.email}</td>
                  <td className="px-4 py-2">{agent.name || "-"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        agent.active
                          ? "inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold"
                          : "inline-block px-3 py-1 rounded-full bg-gray-200 text-gray-600 text-xs"
                      }
                    >
                      {agent.active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDeleteAgent(agent.id)}
                      className="bg-red-500 hover:bg-red-700 text-white px-4 py-1 rounded-lg font-bold shadow text-sm transition"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
