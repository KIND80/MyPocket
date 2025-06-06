import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

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
  const [editValues, setEditValues] = useState<
    Record<string, Partial<Contact>>
  >({});

  useEffect(() => {
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

    fetchData();
  }, [agentId]);

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
      const { data: updatedContacts } = await supabase
        .from("contacts")
        .select("*")
        .eq("agent_id", agentId);
      setContacts(updatedContacts || []);
    }
  };

  return (
    <div className="container">
      <h1 className="text-center">📁 Mon portefeuille</h1>

      {contacts.map((c) => {
        const historique = callHistory
          .filter((h) => h.contact_id === c.id)
          .slice(0, 3);

        const editing = editMode[c.id];
        const values = editValues[c.id] || {};

        return (
          <div
            key={c.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 15,
              marginBottom: 20,
              backgroundColor: "#fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            }}
          >
            <h2>
              {editing ? (
                <input
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
                  value={values.categorie_contact ?? c.categorie_contact}
                  onChange={(e) =>
                    setEditValues((prev) => ({
                      ...prev,
                      [c.id]: {
                        ...prev[c.id],
                        categorie_contact: e.target.value,
                      },
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

            <div style={{ marginTop: 10 }}>
              {editing ? (
                <>
                  <button onClick={() => handleSave(c.id)}>
                    💾 Enregistrer
                  </button>
                  <button
                    onClick={() =>
                      setEditMode((prev) => ({ ...prev, [c.id]: false }))
                    }
                  >
                    ❌ Annuler
                  </button>
                </>
              ) : (
                <button
                  onClick={() =>
                    setEditMode((prev) => ({ ...prev, [c.id]: true }))
                  }
                >
                  ✏️ Modifier
                </button>
              )}
            </div>

            <textarea
              placeholder="Ajouter un commentaire ici..."
              value={commentaire[c.id] || ""}
              onChange={(e) =>
                setCommentaire((prev) => ({
                  ...prev,
                  [c.id]: e.target.value,
                }))
              }
              style={{
                width: "100%",
                marginTop: 10,
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />

            {c.statut === "rdv" && (
              <div style={{ marginTop: 15 }}>
                <p>
                  <strong>🕓 RDV à valider :</strong>
                </p>
                <button
                  onClick={() => validerSignature(c.id, "Signature")}
                  style={{
                    marginRight: 10,
                    backgroundColor: "#4CAF50",
                    color: "#fff",
                    padding: "6px 10px",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  ✅ Signature
                </button>
                <button
                  onClick={() => validerSignature(c.id, "Non Signature")}
                  style={{
                    backgroundColor: "#f44336",
                    color: "#fff",
                    padding: "6px 10px",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  ❌ Non Signature
                </button>
              </div>
            )}

            {historique.length > 0 && (
              <div
                style={{
                  marginTop: 15,
                  backgroundColor: "#f7f7f7",
                  padding: 10,
                  borderRadius: 6,
                }}
              >
                <strong>🕓 3 derniers appels :</strong>
                <ul style={{ marginTop: 6 }}>
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
      })}
    </div>
  );
}
