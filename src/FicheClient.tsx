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
    // eslint-disable-next-line
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

  if (!contact)
    return (
      <p className="text-center mt-10 text-blue-600 animate-pulse">
        Chargement...
      </p>
    );

  // Avatar “pixel art” dynamique
  const avatarUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(
    contact.nom || "Contact"
  )}`;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <img
          src={avatarUrl}
          alt="avatar"
          className="w-16 h-16 rounded-full bg-white border shadow"
        />
        <div>
          <h2 className="text-2xl font-bold text-blue-800 mb-1">
            {contact.nom}
          </h2>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold shadow">
              {contact.statut}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
              RDV: {contact.rdv_date || "Non défini"}
            </span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
              {contact.categorie_contact}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
              {contact.type_assurance}
            </span>
          </div>
        </div>
      </div>

      {/* Infos contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-sm">
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
          <span className="font-semibold">Agent assigné :</span> {contact.agent_id || "—"}
        </div>
      </div>

      {/* Ajouter commentaire */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 mb-8">
        <label className="block font-semibold mb-2 text-blue-900">
          Ajouter un commentaire :
        </label>
        <textarea
          className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          rows={3}
        />
        <button
          onClick={handleSubmitComment}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-xl transition shadow text-lg flex items-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span> Envoi...
            </>
          ) : (
            <>
              <span>✅</span> Valider
            </>
          )}
        </button>
      </div>

      {/* Historique des commentaires */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl shadow p-6">
        <h3 className="text-lg font-semibold text-blue-700 mb-4">
          Historique des commentaires
        </h3>
        {historique.length === 0 ? (
          <p className="text-gray-500">Aucun commentaire pour ce contact.</p>
        ) : (
          <ul className="space-y-4">
            {historique.map((appel) => (
              <li
                key={appel.id}
                className="border-b border-dashed last:border-0 pb-2 hover:bg-blue-50 dark:hover:bg-blue-950 rounded transition px-2"
              >
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                  <span className="font-semibold text-blue-700">
                    {appel.agent_prenom || "Inconnu"} {appel.agent_nom || ""}
                  </span>
                  <span>·</span>
                  {new Date(appel.date).toLocaleString("fr-FR")}
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
