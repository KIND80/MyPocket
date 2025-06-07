import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

type Contact = {
  id: string;
  nom: string;
  telephone: string;
  adresse: string;
  npa: string;
  categorie_contact: string;
  type_assurance: string;
  canton: string;
};

type Appel = {
  id: string;
  date: string;
  statut_appel: string;
  commentaire: string;
};

export default function AppelContact({ agentId }: { agentId: string }) {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filtered, setFiltered] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [categorie, setCategorie] = useState("");
  const [current, setCurrent] = useState<Contact | null>(null);
  const [etatAppel, setEtatAppel] = useState<"init" | "en_cours" | "oui">(
    "init"
  );
  const [historique, setHistorique] = useState<Appel[]>([]);
  const [commentaire, setCommentaire] = useState("");
  const [edition, setEdition] = useState(false);
  const [form, setForm] = useState<Partial<Contact>>({});

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("contacts")
        .select("*")
        .eq("statut", "non_assigné")
        .eq("visible_globally", true);
      setContacts(data || []);
      setFiltered(data || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    let filtres = [...contacts];
    if (search) {
      filtres = filtres.filter((c) =>
        c.telephone.replace(/\s/g, "").includes(search.replace(/\s/g, ""))
      );
    }
    if (categorie) {
      filtres = filtres.filter((c) => c.categorie_contact === categorie);
    }
    setFiltered(filtres);
    if (!search && filtres.length > 0) {
      const rand = filtres[Math.floor(Math.random() * filtres.length)];
      setCurrent(rand);
      setForm(rand); // init form
    }
  }, [search, categorie, contacts]);

  useEffect(() => {
    const fetchHistorique = async () => {
      if (!current) return;
      const { data } = await supabase
        .from("call_history")
        .select("id, date, statut_appel, commentaire")
        .eq("contact_id", current.id)
        .order("date", { ascending: false })
        .limit(3);
      setHistorique(data || []);
    };
    fetchHistorique();
  }, [current]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const enregistrerAppel = async (
    statut: "signature" | "non_signature" | "rdv" | "appel" | "injoignable",
    commentaireFinal: string
  ): Promise<void> => {
    if (!current) return;
    await supabase.from("call_history").insert({
      contact_id: current.id,
      agent_id: agentId,
      statut_appel: statut,
      commentaire: commentaireFinal,
    });
  };

  const handleInjoignable = async () => {
    await enregistrerAppel("non_signature", "Injoignable");
    nextContact();
  };

  // ==> C'est ici qu'on ajoute le LOG <==
  const handleRdv = async () => {
    if (!current || !commentaire.trim()) return;
    await enregistrerAppel("rdv", commentaire.trim());

    const { error, data } = await supabase
      .from("contacts")
      .update({
        agent_id: agentId,
        statut: "rdv",
        visible_globally: false,
      })
      .eq("id", current.id);

    console.log("Résultat UPDATE contact RDV :", {
      error,
      data,
      agentId,
      contactId: current.id,
    });

    window.open(
      `https://calendar.google.com/calendar/u/0/r/eventedit?text=RDV+${current.nom}&details=Tel:+${current.telephone}`,
      "_blank"
    );
    nextContact();
  };

  const handleValiderCommentaire = async () => {
    if (!current || !commentaire.trim()) return;
    await enregistrerAppel("signature", commentaire.trim());
    nextContact();
  };

  const nextContact = () => {
    const restants = filtered.filter((c) => c.id !== current?.id);
    const suivant =
      restants.length > 0
        ? restants[Math.floor(Math.random() * restants.length)]
        : null;
    setCurrent(suivant);
    setForm(suivant || {});
    setEtatAppel("init");
    setCommentaire("");
    setEdition(false);
  };

  const handleUpdateContact = async () => {
    if (!current || !form.nom) return;
    await supabase.from("contacts").update(form).eq("id", current.id);
    setCurrent({ ...current, ...form } as Contact);
    setEdition(false);
  };

  if (!current) {
    return (
      <p className="text-center py-10">
        📭 Aucun contact pour le moment. Revenez plus tard.
      </p>
    );
  }

  const avatarUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(
    current.nom || "Contact"
  )}`;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">📂 Portefeuille Global</h2>
        <button
          onClick={handleLogout}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          🔓 Déconnexion
        </button>
      </div>

      <div className="flex flex-col gap-2 mb-4 sm:flex-row">
        <input
          type="text"
          placeholder="🔍 Rechercher un numéro"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border rounded"
        />
        <select
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
          className="flex-1 px-3 py-2 border rounded"
        >
          <option value="">Toutes les catégories</option>
          <option value="phoning">Phoning</option>
          <option value="subside">Subside</option>
        </select>
      </div>

      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={avatarUrl}
              alt="avatar"
              className="w-14 h-14 rounded-full"
            />
            <div>
              {edition ? (
                <input
                  value={form.nom || ""}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="border rounded px-2 py-1"
                />
              ) : (
                <>
                  <h3 className="text-lg font-semibold">{current.nom}</h3>
                  <p className="text-sm text-gray-600">{current.telephone}</p>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => setEdition(!edition)}
            className="text-sm text-gray-600 hover:text-black"
          >
            ✏️ Modifier
          </button>
        </div>

        {edition ? (
          <>
            {["telephone", "adresse", "npa", "canton", "type_assurance"].map(
              (field) => (
                <input
                  key={field}
                  placeholder={field}
                  value={form[field as keyof Contact] || ""}
                  onChange={(e) =>
                    setForm({ ...form, [field]: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded mb-2"
                />
              )
            )}
            <button
              onClick={handleUpdateContact}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              ✅ Sauvegarder
            </button>
          </>
        ) : (
          <div className="text-sm space-y-1">
            <p>
              📍 Adresse : {current.adresse}, {current.npa}
            </p>
            <p>🏷️ Catégorie : {current.categorie_contact}</p>
            <p>🌍 Canton : {current.canton}</p>
            <p>🛡️ Assurance : {current.type_assurance || "—"}</p>
          </div>
        )}

        {/* Étapes d'appel */}
        {etatAppel === "init" && (
          <div className="space-x-2">
            <a href={`tel:${current.telephone}`}>
              <button
                onClick={() => setEtatAppel("en_cours")}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                📞 Appeler
              </button>
            </a>
            <button
              onClick={nextContact}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            >
              ⏭️ Passer
            </button>
          </div>
        )}

        {etatAppel === "en_cours" && (
          <div className="space-x-2">
            <button
              onClick={handleInjoignable}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              ❌ Injoignable
            </button>
            <button
              onClick={() => setEtatAppel("oui")}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              ✅ Oui
            </button>
          </div>
        )}

        {etatAppel === "oui" && (
          <div>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="📝 Ajouter un commentaire"
              className="w-full px-3 py-2 border rounded mb-2"
            />
            <div className="space-x-2">
              <button
                onClick={handleRdv}
                disabled={!commentaire.trim()}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                📅 RDV
              </button>
              <button
                onClick={handleValiderCommentaire}
                disabled={!commentaire.trim()}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
              >
                📝 Valider
              </button>
            </div>
          </div>
        )}

        {/* Historique */}
        {historique.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">📞 Derniers appels</h4>
            <ul className="text-sm list-disc list-inside space-y-1">
              {historique.map((appel) => (
                <li key={appel.id}>
                  {new Date(appel.date).toLocaleDateString("fr-FR")} —{" "}
                  {appel.statut_appel}
                  <br />
                  📝 {appel.commentaire}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
