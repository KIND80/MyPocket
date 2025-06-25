import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

type Agent = { id: string; name: string; email: string };
type ContactForm = {
  nom: string;
  telephone: string;
  email: string;
  adresse?: string;
  type_assurance?: string;
  categorie_contact?: string;
  canton?: string;
  agent_id?: string;
};

export default function AjouterContact({
  entrepriseId,
  onSuccess,
}: {
  entrepriseId: string;
  onSuccess?: () => void;
}) {
  const [form, setForm] = useState<ContactForm>({
    nom: "",
    telephone: "",
    email: "",
    adresse: "",
    type_assurance: "",
    categorie_contact: "",
    canton: "",
    agent_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    const fetchAgents = async () => {
      const { data } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("company_id", entrepriseId)
        .eq("role", "agent");
      setAgents(data || []);
    };
    fetchAgents();
  }, [entrepriseId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    // Corrige ici : si agent_id n’est pas défini ou vide, mets null
    const isAssigned = !!form.agent_id && form.agent_id !== "";
    const payload: any = {
      nom: form.nom,
      telephone: form.telephone,
      email: form.email,
      adresse: form.adresse,
      type_assurance: form.type_assurance,
      categorie_contact: form.categorie_contact,
      canton: form.canton,
      company_id: entrepriseId, // c'est bien company_id dans ta table !
      agent_id: isAssigned ? form.agent_id : null,
      statut: isAssigned ? "assigné" : "non_assigné",
      visible_globally: !isAssigned,
    };

    const { error } = await supabase.from("contacts").insert([payload]);

    if (error) {
      setMsg(
        "❌ Erreur lors de la création du contact : " +
          (error.message || "Erreur inconnue")
      );
      setLoading(false);
      return;
    }

    setMsg("✅ Contact ajouté avec succès !");
    setLoading(false);
    setForm({
      nom: "",
      telephone: "",
      email: "",
      adresse: "",
      type_assurance: "",
      categorie_contact: "",
      canton: "",
      agent_id: "",
    });
    if (onSuccess) onSuccess();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#e6eef8] via-[#fdf6ee] to-[#f4eee8] py-8 font-sans transition">
      <div className="w-full max-w-lg bg-white/90 rounded-3xl shadow-2xl px-8 py-7 border border-[#e6eef8]">
        <h2 className="text-3xl font-extrabold mb-4 text-[#235ea6] flex items-center gap-2">
          ➕ Ajouter un contact
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Champs standards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="nom"
              required
              value={form.nom}
              onChange={handleChange}
              placeholder="Nom"
              className="border border-[#e6eef8] focus:border-[#235ea6] bg-[#f8fafc] rounded-xl px-4 py-2 w-full transition"
            />
            <input
              type="tel"
              name="telephone"
              required
              value={form.telephone}
              onChange={handleChange}
              placeholder="Téléphone"
              className="border border-[#e6eef8] focus:border-[#235ea6] bg-[#f8fafc] rounded-xl px-4 py-2 w-full transition"
            />
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              className="border border-[#e6eef8] focus:border-[#235ea6] bg-[#f8fafc] rounded-xl px-4 py-2 w-full transition"
            />
            <input
              type="text"
              name="adresse"
              value={form.adresse}
              onChange={handleChange}
              placeholder="Adresse"
              className="border border-[#e6eef8] focus:border-[#235ea6] bg-[#f8fafc] rounded-xl px-4 py-2 w-full transition"
            />
            <input
              type="text"
              name="type_assurance"
              value={form.type_assurance}
              onChange={handleChange}
              placeholder="Type d'assurance"
              className="border border-[#e6eef8] focus:border-[#235ea6] bg-[#f8fafc] rounded-xl px-4 py-2 w-full transition"
            />
            <input
              type="text"
              name="categorie_contact"
              value={form.categorie_contact}
              onChange={handleChange}
              placeholder="Catégorie contact"
              className="border border-[#e6eef8] focus:border-[#235ea6] bg-[#f8fafc] rounded-xl px-4 py-2 w-full transition"
            />
            <input
              type="text"
              name="canton"
              value={form.canton}
              onChange={handleChange}
              placeholder="Canton"
              className="border border-[#e6eef8] focus:border-[#235ea6] bg-[#f8fafc] rounded-xl px-4 py-2 w-full transition"
            />
          </div>

          {/* Assignation à un agent */}
          <div>
            <label className="font-bold text-sm mb-1 block text-[#235ea6]">
              Assigner à un agent (optionnel) :
            </label>
            <select
              name="agent_id"
              value={form.agent_id}
              onChange={handleChange}
              className="border border-[#e6eef8] focus:border-[#235ea6] bg-[#f8fafc] rounded-xl px-4 py-2 w-full transition"
            >
              <option value="">— Laisser non assigné —</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.email})
                </option>
              ))}
            </select>
          </div>

          {msg && (
            <div
              className={`text-center font-bold rounded-xl py-2 px-3 mt-1 shadow ${
                msg.startsWith("✅")
                  ? "text-green-700 bg-green-50 animate-fade-in"
                  : "text-red-700 bg-red-50 animate-shake"
              }`}
            >
              {msg}
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-2 bg-[#235ea6] hover:bg-[#174073] text-white font-bold py-3 rounded-2xl shadow-xl text-lg transition-all tracking-wide"
            disabled={loading}
          >
            {loading ? (
              <span className="animate-pulse">Ajout en cours...</span>
            ) : (
              <>Ajouter le contact</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
