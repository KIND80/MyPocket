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
};

export default function PortefeuilleAgent({ agentId }: { agentId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [callHistory, setCallHistory] = useState<Appel[]>([]);
  const [commentaire, setCommentaire] = useState<Record<string, string>>({});
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [editValues, setEditValues] = useState<Record<string, Partial<Contact>>>({});

  // Rafraîchissement automatique toutes les 4 secondes
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
      .select("*")
      .order("date", { ascending: false });

    setContacts(contactData || []);
    setCallHistory(appelsData || []);
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
      statut_appel: "Répondu",
      commentaire: commentaireTexte || type,
    });

    alert(`${type} soumise à validation.`);
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
    const historique = callHistory
      .filter((h) => h.contact_id === c.id)
      .slice(0, 3);
    const editing = editMode[c.id];
    const values = editValues[c.id] || {};

    return (
      <div key={c.id} className="border rounded-lg p-4 shadow-md bg-white mb-6">
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

        <textarea
          placeholder="Ajouter un commentaire ici..."
          value={commentaire[c.id] || ""}
          onChange={(e) =>
            setCommentaire((prev) => ({ ...prev, [c.id]: e.target.value }))
          }
          className="w-full mt-2 border rounded px-2 py-1"
        />

        {c.statut === "rdv" && (
          <div className="mt-3">
            <button
              onClick={() => validerSignature(c.id, "Signature")}
              className="bg-green-500 text-white px-4 py-2 rounded mr-2"
            >
              ✅ Signature
            </button>
            <button
              onClick={() => validerSignature(c.id, "Non Signature")}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              ❌ Non Signature
            </button>
          </div>
        )}

        {historique.length > 0 && (
          <div className="mt-4 bg-gray-100 p-3 rounded">
            <strong>🕓 3 derniers appels :</strong>
            <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
              {historique.map((h) => (
                <li key={h.id}>
                  {new Date(h.date).toLocaleString()} — {h.statut_appel}
                  {h.commentaire && ` — ${h.commentaire}`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
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
