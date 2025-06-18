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

  // --- Historique factorisé ---
  const fetchHistorique = async (contactId: string) => {
    const { data } = await supabase
      .from("call_history")
      .select("id, date, statut_appel, commentaire")
      .eq("contact_id", contactId)
      .order("date", { ascending: false })
      .limit(3);
    setHistorique(data || []);
  };

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

  // Recherche sur nom ET téléphone + filtre catégorie
  useEffect(() => {
    let filtres = [...contacts];
    if (search.trim()) {
      const searchLower = search.toLowerCase().replace(/\s/g, "");
      filtres = filtres.filter(
        (c) =>
          c.nom.toLowerCase().includes(search.toLowerCase()) ||
          c.telephone.replace(/\s/g, "").includes(searchLower)
      );
    }
    if (categorie) {
      filtres = filtres.filter((c) => c.categorie_contact === categorie);
    }
    setFiltered(filtres);
  }, [search, categorie, contacts]);

  // Affiche un contact au hasard parmi les filtrés
  useEffect(() => {
    if (filtered.length > 0) {
      const randomIdx = Math.floor(Math.random() * filtered.length);
      setCurrent(filtered[randomIdx]);
      setForm(filtered[randomIdx]);
    } else {
      setCurrent(null);
      setForm({});
    }
  }, [filtered]);

  // Historique toujours à jour pour le contact courant
  useEffect(() => {
    if (current) fetchHistorique(current.id);
    else setHistorique([]);
  }, [current]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const enregistrerAppel = async (
    statut: "note" | "non_signature" | "rdv" | "appel",
    commentaireFinal: string
  ): Promise<void> => {
    if (!current) return;
    await supabase.from("call_history").insert({
      contact_id: current.id,
      agent_id: agentId,
      statut_appel: statut,
      commentaire: commentaireFinal,
    });
    // 👇 Recharge l'historique tout de suite après
    await fetchHistorique(current.id);
  };

  const handlePasser = async () => {
    if (current) {
      await enregistrerAppel("appel", "Contact passé sans appel");
    }
    nextContact();
  };

  const handleInjoignable = async () => {
    await enregistrerAppel("non_signature", "Injoignable");
    nextContact();
  };

  const handleRdv = async () => {
    if (!current || !commentaire.trim()) return;
    await enregistrerAppel("rdv", commentaire.trim());
    await supabase
      .from("contacts")
      .update({
        agent_id: agentId,
        statut: "rdv",
        visible_globally: false,
      })
      .eq("id", current.id);

    window.open(
      `https://calendar.google.com/calendar/u/0/r/eventedit?text=RDV+${current.nom}&details=Tel:+${current.telephone}`,
      "_blank"
    );
    nextContact();
  };

  const handleValiderCommentaire = async () => {
    if (!current || !commentaire.trim()) return;
    await enregistrerAppel("note", commentaire.trim());
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

  // Génère la liste des catégories distinctes (phoning, subside, ...)
  const categoriesDisponibles = Array.from(
    new Set(contacts.map((c) => c.categorie_contact).filter(Boolean))
  );

  if (!current) {
    return (
      <div className="text-center py-10 text-lg text-gray-600 dark:text-gray-300">
        📭 Aucun contact pour le moment. Revenez plus tard.
      </div>
    );
  }

  const avatarUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(
    current.nom || "Contact"
  )}`;

  return (
    <div className="max-w-2xl mx-auto p-3 sm:p-6">
      {/* --- Barre de recherche et filtre catégorie --- */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="🔎 Rechercher (nom, téléphone)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 px-3 py-2 border rounded-xl shadow"
        />
        <select
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
          className="w-full sm:w-56 px-3 py-2 border rounded-xl shadow"
        >
          <option value="">Toutes les catégories</option>
          {categoriesDisponibles.map((cat) => (
            <option key={cat} value={cat}>
              {/* Ici tu peux mettre des labels custom */}
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-200 flex items-center gap-1">
            📂 Portefeuille Global
          </h2>
        </div>
        <button
          onClick={handleLogout}
          className="bg-gray-700 hover:bg-gray-900 text-white px-4 py-2 rounded-xl shadow transition font-bold flex items-center gap-1"
        >
          🔓 Déconnexion
        </button>
      </div>

      {/* Fiche contact */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl px-4 py-5 sm:px-8 mb-4 animate-fade-in-up">
        {/* Infos principales */}
        <div className="flex flex-col sm:flex-row gap-5 items-center mb-4">
          <img
            src={avatarUrl}
            alt="avatar"
            className="w-16 h-16 rounded-full border-2 border-blue-400 bg-white"
          />
          <div className="flex-1 w-full">
            {edition ? (
              <input
                value={form.nom || ""}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="border rounded-xl px-3 py-2 w-full mb-2 text-lg"
              />
            ) : (
              <h3 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                {current.nom}
              </h3>
            )}
            <p className="text-sm text-gray-500 mb-1">{current.telephone}</p>
            <p className="text-xs text-gray-400 mb-1">
              {current.categorie_contact}
            </p>
          </div>
          <button
            onClick={() => setEdition(!edition)}
            className="text-sm text-gray-500 hover:text-blue-700 px-3 py-2 rounded transition"
          >
            ✏️ {edition ? "Annuler" : "Modifier"}
          </button>
        </div>

        {/* Edition étendue */}
        {edition && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            {["telephone", "adresse", "npa", "canton", "type_assurance"].map(
              (field) => (
                <input
                  key={field}
                  placeholder={field}
                  value={form[field as keyof Contact] || ""}
                  onChange={(e) =>
                    setForm({ ...form, [field]: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl"
                />
              )
            )}
            <button
              onClick={handleUpdateContact}
              className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 font-bold col-span-2"
            >
              ✅ Sauvegarder
            </button>
          </div>
        )}

        {/* Données contact */}
        {!edition && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
            <p>
              <span className="font-semibold">📍 Adresse :</span>{" "}
              {current.adresse}, {current.npa}
            </p>
            <p>
              <span className="font-semibold">🏷️ Catégorie :</span>{" "}
              {current.categorie_contact}
            </p>
            <p>
              <span className="font-semibold">🌍 Canton :</span>{" "}
              {current.canton}
            </p>
            <p>
              <span className="font-semibold">🛡️ Assurance :</span>{" "}
              {current.type_assurance || "—"}
            </p>
          </div>
        )}

        {/* Etapes d'appel */}
        <div className="my-4">
          {etatAppel === "init" && (
            <div className="flex flex-wrap gap-3">
              <a href={`tel:${current.telephone}`}>
                <button
                  onClick={() => setEtatAppel("en_cours")}
                  className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-blue-700 shadow transition flex items-center gap-2"
                >
                  📞 Appeler
                </button>
              </a>
              <button
                onClick={handlePasser}
                className="bg-gray-200 text-gray-800 px-5 py-2 rounded-xl font-bold hover:bg-gray-400 shadow transition"
              >
                ⏭️ Passer
              </button>
            </div>
          )}

          {etatAppel === "en_cours" && (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleInjoignable}
                className="bg-red-500 text-white px-5 py-2 rounded-xl font-bold hover:bg-red-700 shadow transition"
              >
                ❌ Injoignable
              </button>
              <button
                onClick={() => setEtatAppel("oui")}
                className="bg-green-500 text-white px-5 py-2 rounded-xl font-bold hover:bg-green-700 shadow transition"
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
                className="w-full px-4 py-2 border rounded-xl mb-2"
              />
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleRdv}
                  disabled={!commentaire.trim()}
                  className="bg-blue-500 text-white px-5 py-2 rounded-xl font-bold hover:bg-blue-600 shadow transition disabled:opacity-50 flex items-center gap-1"
                >
                  📅 RDV
                </button>
                <button
                  onClick={handleValiderCommentaire}
                  disabled={!commentaire.trim()}
                  className="bg-gray-500 text-white px-5 py-2 rounded-xl font-bold hover:bg-gray-600 shadow transition disabled:opacity-50 flex items-center gap-1"
                >
                  📝 Valider
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Historique */}
        {historique.length > 0 && (
          <div className="mt-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <h4 className="font-bold mb-2 text-blue-800 dark:text-blue-200">
              📞 Derniers appels
            </h4>
            <ul className="text-sm space-y-2">
              {historique.map((appel) => (
                <li key={appel.id} className="flex flex-col">
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {new Date(appel.date).toLocaleDateString("fr-FR")} —{" "}
                    {appel.statut_appel}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    📝 {appel.commentaire}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
