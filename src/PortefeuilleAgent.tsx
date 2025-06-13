import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Types
type Contact = {
  id: string;
  nom: string;
  telephone: string;
  adresse: string;
  npa: string;
  type_assurance: string;
  categorie_contact: string;
  agent_id: string;
  rdv_date: string;
  statut: string;
};

type Appel = {
  id: string;
  contact_id: string;
  date: string;
  statut_appel: string;
  commentaire: string;
  agent: { prenom?: string; nom?: string } | null;
};

// ---- Composant MES NOTES ----
function MesNotes({ agentId }: { agentId: string }) {
  const [notes, setNotes] = useState<
    { id: string; note: string; created_at: string }[]
  >([]);
  const [note, setNote] = useState("");

  const fetchNotes = async () => {
    const { data } = await supabase
      .from("user_notes")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });
    setNotes(data || []);
  };

  useEffect(() => {
    fetchNotes();
    // Facultatif: recharger à intervalle régulier
    // const interval = setInterval(fetchNotes, 10000);
    // return () => clearInterval(interval);
  }, [agentId]);

  const handleAddNote = async () => {
    if (!note.trim()) return;
    await supabase.from("user_notes").insert({
      agent_id: agentId,
      note: note.trim(),
    });
    setNote("");
    fetchNotes();
  };

  const handleDeleteNote = async (id: string) => {
    await supabase.from("user_notes").delete().eq("id", id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="bg-gray-50 border rounded-lg p-4 mb-8 shadow">
      <h2 className="font-bold mb-2">🗒️ Mes notes personnelles</h2>
      <div className="flex gap-2 mb-2">
        <textarea
          className="flex-1 border rounded px-2 py-1"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ajouter une note ou un rappel perso…"
          rows={2}
        />
        <button
          onClick={handleAddNote}
          className="bg-blue-500 text-white px-3 py-2 rounded font-bold"
        >
          Ajouter
        </button>
      </div>
      {notes.length === 0 ? (
        <p className="text-gray-400 text-sm">Aucune note pour le moment.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="flex justify-between items-center bg-white border rounded px-3 py-1"
            >
              <span className="text-gray-700">{n.note}</span>
              <button
                onClick={() => handleDeleteNote(n.id)}
                className="text-red-400 hover:text-red-700 text-xs ml-2"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---- COMPOSANT PRINCIPAL ----
export default function PortefeuilleAgent({ agentId }: { agentId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [callHistory, setCallHistory] = useState<Appel[]>([]);
  const [commentaire, setCommentaire] = useState<Record<string, string>>({});
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [editValues, setEditValues] = useState<
    Record<string, Partial<Contact>>
  >({});

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [agentId]);

  const fetchData = async () => {
    const { data: contactData } = await supabase
      .from("contacts")
      .select("*")
      .eq("agent_id", agentId);

    const { data: appelsData } = await supabase
      .from("call_history")
      .select("*, users:agent_id (prenom, nom)")
      .order("date", { ascending: false });

    const formattedAppels =
      appelsData?.map((a: any) => ({
        id: a.id,
        contact_id: a.contact_id,
        date: a.date,
        statut_appel: a.statut_appel,
        commentaire: a.commentaire,
        agent: a.users ? { prenom: a.users.prenom, nom: a.users.nom } : null,
      })) || [];

    setContacts(contactData || []);
    setCallHistory(formattedAppels);
  };

  const contactsAvecRDV = contacts.filter((c) => {
    const hasCommentaire = callHistory.some(
      (h) => h.contact_id === c.id && h.commentaire?.trim()
    );
    return c.statut === "rdv" && hasCommentaire;
  });

  const contactsRestants = contacts.filter(
    (c) => !contactsAvecRDV.some((rdv) => rdv.id === c.id)
  );

  const validerSignature = async (
    contactId: string,
    type: "Signature" | "Non Signature"
  ) => {
    const commentaireTexte = commentaire[contactId]?.trim();
    if (!commentaireTexte) {
      alert("Merci de saisir un commentaire avant de valider.");
      return;
    }

    await supabase
      .from("contacts")
      .update({ statut: "à_valider" })
      .eq("id", contactId);

    await supabase.from("call_history").insert({
      contact_id: contactId,
      agent_id: agentId,
      statut_appel: type === "Signature" ? "signature" : "non_signature",
      commentaire: commentaireTexte,
      admin_validation: null, // Pour workflow admin !
    });

    setCommentaire((prev) => ({ ...prev, [contactId]: "" }));
    await fetchData();
  };

  const ajouterCommentaire = async (contactId: string) => {
    const texte = commentaire[contactId]?.trim();
    if (!texte) return alert("Merci de saisir un commentaire.");
    await supabase.from("call_history").insert({
      contact_id: contactId,
      agent_id: agentId,
      statut_appel: "Note",
      commentaire: texte,
    });
    setCommentaire((prev) => ({ ...prev, [contactId]: "" }));
    await fetchData();
  };

  const handleSave = async (id: string) => {
    const updates = editValues[id];
    if (!updates) return;

    const { error } = await supabase
      .from("contacts")
      .update(updates)
      .eq("id", id);

    if (error) {
      alert("Erreur lors de la mise à jour");
    } else {
      setEditMode((prev) => ({ ...prev, [id]: false }));
      setEditValues((prev) => ({ ...prev, [id]: {} }));
      await fetchData();
    }
  };

  const renderContactCard = (c: Contact) => {
    // Historique complet pour ce contact (le plus récent en haut)
    const historique = callHistory
      .filter((h) => h.contact_id === c.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const editing = editMode[c.id];
    const values = editValues[c.id] || {};

    return (
      <div key={c.id} className="border rounded-lg p-4 shadow-md bg-white mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {editing ? (
              <input
                className="border rounded px-2 py-1"
                value={values.nom ?? c.nom}
                onChange={(e) =>
                  setEditValues((prev) => ({
                    ...prev,
                    [c.id]: { ...prev[c.id], nom: e.target.value },
                  }))
                }
              />
            ) : (
              c.nom
            )}
          </h2>
          {/* BADGE VALIDÉ */}
          {c.statut === "assigné" && (
            <span className="inline-flex items-center px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold animate-pulse ml-2">
              ✅ Validé
            </span>
          )}
        </div>

        <p>
          <strong>📞 Téléphone :</strong>{" "}
          {editing ? (
            <input
              className="border rounded px-2 py-1"
              value={values.telephone ?? c.telephone}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  [c.id]: { ...prev[c.id], telephone: e.target.value },
                }))
              }
            />
          ) : (
            c.telephone
          )}
        </p>

        <p>
          <strong>📋 Catégorie :</strong>{" "}
          {editing ? (
            <input
              className="border rounded px-2 py-1"
              value={values.categorie_contact ?? c.categorie_contact}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  [c.id]: { ...prev[c.id], categorie_contact: e.target.value },
                }))
              }
            />
          ) : (
            c.categorie_contact
          )}
        </p>

        <p>
          <strong>🛡️ Assurance :</strong>{" "}
          {editing ? (
            <input
              className="border rounded px-2 py-1"
              value={values.type_assurance ?? c.type_assurance}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  [c.id]: { ...prev[c.id], type_assurance: e.target.value },
                }))
              }
            />
          ) : (
            c.type_assurance
          )}
        </p>

        <p>
          <strong>🏠 Adresse :</strong>{" "}
          {editing ? (
            <input
              className="border rounded px-2 py-1"
              value={values.adresse ?? c.adresse}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  [c.id]: { ...prev[c.id], adresse: e.target.value },
                }))
              }
            />
          ) : (
            `${c.adresse} ${c.npa}`
          )}
        </p>

        <div className="mt-2">
          {editing ? (
            <>
              <button
                onClick={() => handleSave(c.id)}
                className="mr-2 bg-blue-500 text-white px-3 py-1 rounded"
              >
                💾 Enregistrer
              </button>
              <button
                onClick={() =>
                  setEditMode((prev) => ({ ...prev, [c.id]: false }))
                }
                className="bg-gray-300 px-3 py-1 rounded"
              >
                ❌ Annuler
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode((prev) => ({ ...prev, [c.id]: true }))}
              className="bg-yellow-400 text-black px-3 py-1 rounded"
            >
              ✏️ Modifier
            </button>
          )}
        </div>

        {/* Champ commentaire + bouton, toujours visible */}
        <div className="flex gap-2 mt-2">
          <textarea
            placeholder="Ajouter un commentaire ici..."
            value={commentaire[c.id] || ""}
            onChange={(e) =>
              setCommentaire((prev) => ({ ...prev, [c.id]: e.target.value }))
            }
            className="w-full border rounded px-2 py-1"
            rows={2}
          />
          <button
            onClick={() => ajouterCommentaire(c.id)}
            className="bg-blue-500 text-white px-4 py-2 rounded font-bold"
          >
            Envoyer
          </button>
        </div>

        {/* Signature/Non Signature : seulement si statut = rdv */}
        {c.statut === "rdv" && (
          <div className="mt-3">
            <button
              onClick={() => validerSignature(c.id, "Signature")}
              disabled={!commentaire[c.id]?.trim()}
              className="bg-green-500 text-white px-4 py-2 rounded mr-2 disabled:opacity-50"
            >
              ✅ Signature
            </button>
            <button
              onClick={() => validerSignature(c.id, "Non Signature")}
              disabled={!commentaire[c.id]?.trim()}
              className="bg-red-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              ❌ Non Signature
            </button>
          </div>
        )}

        {/* Historique avec scrolling */}
        <div
          className="mt-4 bg-gray-100 p-3 rounded"
          style={{ maxHeight: 200, overflowY: "auto" }}
        >
          <strong>🕓 Historique des commentaires :</strong>
          {historique.length === 0 ? (
            <div className="text-gray-400 italic text-sm">
              Aucun commentaire.
            </div>
          ) : (
            <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
              {historique.map((h) => (
                <li key={h.id}>
                  <span className="font-bold">
                    {h.agent
                      ? `${h.agent.prenom || ""} ${h.agent.nom || ""}`.trim()
                      : "Agent inconnu"}
                  </span>{" "}
                  <span className="text-gray-500">
                    {new Date(h.date).toLocaleString()}
                  </span>
                  {" — "}
                  <span className="italic">{h.statut_appel}</span>
                  {h.commentaire && ` : ${h.commentaire}`}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <MesNotes agentId={agentId} />

      <h1 className="text-2xl font-bold mb-6 text-center">
        📁 Mon portefeuille
      </h1>

      <h2 className="text-lg font-semibold mb-2">
        📌 Contacts à suivre (RDV + commentaire)
      </h2>
      {contactsAvecRDV.length === 0 ? (
        <p className="text-gray-500">Aucun contact à suivre.</p>
      ) : (
        contactsAvecRDV.map(renderContactCard)
      )}

      <h2 className="text-lg font-semibold mt-6 mb-2">📋 Autres contacts</h2>
      {contactsRestants.length === 0 ? (
        <p className="text-gray-500">Aucun autre contact assigné.</p>
      ) : (
        contactsRestants.map(renderContactCard)
      )}
    </div>
  );
}
