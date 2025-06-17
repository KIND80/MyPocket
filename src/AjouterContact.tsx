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

    // LOG DEBUG 👇
    //console.log("Payload contact", payload);

    const { error } = await supabase.from("contacts").insert([payload]);

    if (error) {
      // LOG ERREUR DETAILLEE 👇
      //console.log("ERREUR SUPABASE:", error);
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-2">
      <div className="max-w-lg w-full rounded-2xl shadow-xl bg-white p-6">
        <h2 className="text-2xl font-bold mb-4">➕ Ajouter un contact</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Champs standards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              name="nom"
              required
              value={form.nom}
              onChange={handleChange}
              placeholder="Nom"
              className="border rounded-lg px-4 py-2 w-full"
            />
            <input
              type="tel"
              name="telephone"
              required
              value={form.telephone}
              onChange={handleChange}
              placeholder="Téléphone"
              className="border rounded-lg px-4 py-2 w-full"
            />
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              className="border rounded-lg px-4 py-2 w-full"
            />
            <input
              type="text"
              name="adresse"
              value={form.adresse}
              onChange={handleChange}
              placeholder="Adresse"
              className="border rounded-lg px-4 py-2 w-full"
            />
            <input
              type="text"
              name="type_assurance"
              value={form.type_assurance}
              onChange={handleChange}
              placeholder="Type d'assurance"
              className="border rounded-lg px-4 py-2 w-full"
            />
            <input
              type="text"
              name="categorie_contact"
              value={form.categorie_contact}
              onChange={handleChange}
              placeholder="Catégorie contact"
              className="border rounded-lg px-4 py-2 w-full"
            />
            <input
              type="text"
              name="canton"
              value={form.canton}
              onChange={handleChange}
              placeholder="Canton"
              className="border rounded-lg px-4 py-2 w-full"
            />
          </div>

          {/* Assignation à un agent */}
          <div className="mt-2">
            <label className="font-bold text-sm mb-1 block">
              Assigner à un agent (optionnel) :
            </label>
            <select
              name="agent_id"
              value={form.agent_id}
              onChange={handleChange}
              className="border rounded-lg px-4 py-2 w-full"
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
              className={`text-center font-bold ${
                msg.startsWith("✅")
                  ? "text-green-600 animate-fade-in"
                  : "text-red-600 animate-shake"
              }`}
            >
              {msg}
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-2 bg-blue-600 text-white font-bold py-2 rounded-xl hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Ajout en cours..." : "Ajouter le contact"}
          </button>
        </form>
      </div>
    </div>
  );
}
