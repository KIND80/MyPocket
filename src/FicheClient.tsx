import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

type Contact = {
  id: string;
  nom: string;
  telephone: string;
  adresse: string;
  npa: string;
  type_assurance: string;
  categorie_contact: string;
  rdv_date: string;
  agent_id: string;
  statut: string;
};

type Appel = {
  id: string;
  date: string;
  commentaire: string;
  agent_prenom?: string;
  agent_nom?: string;
};

export default function FicheClient({
  contactId,
  agentId,
}: {
  contactId: string;
  agentId: string;
}) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [historique, setHistorique] = useState<Appel[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchContact = async () => {
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .single();
    setContact(data);
  };

  const fetchHistorique = async () => {
    // Attention : adapte 'users' si ta table des agents s'appelle 'agents'
    const { data } = await supabase
      .from("call_history")
      .select("*, users:agent_id (prenom, nom)")
      .eq("contact_id", contactId)
      .order("date", { ascending: false });

    const formatted =
      data?.map((d: any) => ({
        id: d.id,
        date: d.date,
        commentaire: d.commentaire,
        agent_prenom: d.users?.prenom || "",
        agent_nom: d.users?.nom || "",
      })) || [];

    setHistorique(formatted);
  };

  useEffect(() => {
    fetchContact();
    fetchHistorique();
  }, [contactId]);

  const handleSubmitComment = async () => {
    if (!commentaire.trim()) return;

    setLoading(true);
    await supabase.from("call_history").insert({
      contact_id: contactId,
      agent_id: agentId,
      commentaire,
      date: new Date().toISOString(),
    });

    await supabase
      .from("contacts")
      .update({ statut: "à_valider" })
      .eq("id", contactId);

    setCommentaire("");
    await fetchHistorique();
    await fetchContact();
    setLoading(false);
  };

  if (!contact) return <p className="text-center mt-10">Chargement...</p>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Fiche client
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Nom :</span> {contact.nom}
          </div>
          <div>
            <span className="font-semibold">Téléphone :</span> {contact.telephone}
          </div>
          <div>
            <span className="font-semibold">Adresse :</span> {contact.adresse}
          </div>
          <div>
            <span className="font-semibold">NPA :</span> {contact.npa}
          </div>
          <div>
            <span className="font-semibold">Assurance :</span> {contact.type_assurance}
          </div>
          <div>
            <span className="font-semibold">Catégorie :</span> {contact.categorie_contact}
          </div>
          <div>
            <span className="font-semibold">RDV :</span> {contact.rdv_date || "Non défini"}
          </div>
          <div>
            <span className="font-semibold">Statut :</span> {contact.statut}
          </div>
        </div>

        <div className="mt-6">
          <label className="block font-semibold mb-2">
            Ajouter un commentaire :
          </label>
          <textarea
            className="w-full border rounded-md p-2 text-sm"
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            rows={3}
          />
          <button
            onClick={handleSubmitComment}
            className="mt-3 bg-green-500 text-white font-semibold px-4 py-2 rounded hover:bg-green-600"
            disabled={loading}
          >
            {loading ? "Envoi en cours..." : "Valider"}
          </button>
        </div>
      </div>

      <div className="bg-white mt-6 rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">
          Historique des commentaires
        </h3>
        {historique.length === 0 ? (
          <p className="text-gray-500">Aucun commentaire pour ce contact.</p>
        ) : (
          <ul className="space-y-4">
            {historique.map((appel) => (
              <li key={appel.id} className="border-b pb-2">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">
                    {appel.agent_prenom || "Inconnu"} {appel.agent_nom || ""}
                  </span>{" "}
                  — {new Date(appel.date).toLocaleString("fr-FR")}
                </p>
                <p className="text-gray-800">{appel.commentaire}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
