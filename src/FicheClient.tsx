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
      <div className="flex justify-center items-center min-h-screen">
        <span className="text-xl text-blue-600 animate-pulse">
          Chargement...
        </span>
      </div>
    );

  const avatarUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(
    contact.nom || "Contact"
  )}`;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-10 font-sans bg-gradient-to-br from-[#e6eef8] via-[#fdf6ee] to-[#f4eee8] min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-5 bg-white shadow-lg rounded-3xl p-6 mb-8">
        <img
          src={avatarUrl}
          alt="Avatar"
          className="w-20 h-20 rounded-full border-2 border-[#235ea6]"
        />
        <div>
          <h2 className="text-3xl font-bold text-[#235ea6]">{contact.nom}</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge text={contact.statut} bg="bg-blue-100" textColor="text-blue-800" />
            <Badge
              text={`RDV: ${contact.rdv_date || "Non défini"}`}
              bg="bg-green-100"
              textColor="text-green-700"
            />
            <Badge
              text={contact.categorie_contact}
              bg="bg-yellow-100"
              textColor="text-yellow-700"
            />
            <Badge
              text={contact.type_assurance || "—"}
              bg="bg-gray-100"
              textColor="text-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Infos contact */}
      <div className="bg-white rounded-3xl shadow-lg p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <InfoLine label="📞 Téléphone" value={contact.telephone} />
        <InfoLine label="🏠 Adresse" value={contact.adresse} />
        <InfoLine label="📮 NPA" value={contact.npa} />
        <InfoLine
          label="👤 Agent assigné"
          value={contact.agent_id || "—"}
        />
      </div>

      {/* Ajouter commentaire */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
        <label className="block font-semibold text-lg mb-3 text-[#235ea6]">
          📝 Ajouter un commentaire
        </label>
        <textarea
          className="w-full border border-[#e6eef8] rounded-xl p-3 focus:ring-2 focus:ring-[#235ea6] transition"
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          rows={4}
          placeholder="Votre commentaire ici..."
        />
        <button
          onClick={handleSubmitComment}
          disabled={loading || !commentaire.trim()}
          className={`mt-4 w-full sm:w-auto bg-[#235ea6] hover:bg-[#174073] text-white font-bold py-2 px-6 rounded-xl transition shadow-xl ${
            loading ? "opacity-70 cursor-wait" : ""
          }`}
        >
          {loading ? "⏳ Envoi..." : "✅ Valider"}
        </button>
      </div>

      {/* Historique */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-[#235ea6] mb-4">
          📜 Historique des commentaires
        </h3>
        {historique.length === 0 ? (
          <p className="text-gray-500">Aucun commentaire.</p>
        ) : (
          <ul className="space-y-4">
            {historique.map((appel) => (
              <li key={appel.id} className="border-b border-dashed last:border-0 pb-3">
                <div className="text-sm text-gray-500 mb-1">
                  <span className="font-semibold text-[#235ea6]">
                    {appel.agent_prenom} {appel.agent_nom}
                  </span>
                  <span className="mx-1">·</span>
                  {new Date(appel.date).toLocaleString("fr-FR")}
                </div>
                <p className="text-gray-800">{appel.commentaire}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Composants réutilisables :

function Badge({ text, bg, textColor }: { text: string; bg: string; textColor: string }) {
  return (
    <span className={`px-3 py-1 ${bg} ${textColor} rounded-full text-xs shadow-sm font-bold`}>
      {text}
    </span>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-gray-700">
      <span className="font-semibold">{label} :</span> {value}
    </div>
  );
}
