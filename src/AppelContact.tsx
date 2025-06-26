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

  const categoriesDisponibles = Array.from(
    new Set(contacts.map((c) => c.categorie_contact).filter(Boolean))
  );

  if (!current) {
    return (
      <div className="text-center py-10 text-lg text-[#235ea6] font-semibold">
        📭 Aucun contact pour le moment. <br /> Revenez plus tard.
      </div>
    );
  }

  const avatarUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(
    current.nom || "Contact"
  )}`;

  return (
    <div className="min-h-[90vh] bg-gradient-to-br from-[#e6eef8] via-[#fdf6ee] to-[#f4eee8] rounded-3xl shadow-2xl py-8 px-2 sm:px-6 max-w-2xl mx-auto font-sans transition">
      {/* --- Header sticky --- */}
      <div className="sticky top-0 z-10 bg-opacity-80 bg-[#fdf6ee] rounded-2xl flex flex-col sm:flex-row gap-3 sm:gap-8 justify-between items-center py-3 px-4 shadow mb-8 border border-[#e6eef8]">
        <div className="flex-1 flex flex-col sm:flex-row gap-2 items-center">
          <input
            type="text"
            placeholder="🔎 Nom ou téléphone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-60 px-4 py-2 rounded-2xl border border-[#e6eef8] focus:border-[#235ea6] shadow transition"
          />
          <select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
            className="w-48 px-4 py-2 rounded-2xl border border-[#e6eef8] focus:border-[#235ea6] shadow transition"
          >
            <option value="">Toutes les catégories</option>
            {categoriesDisponibles.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleLogout}
          className="bg-[#fcbf49] hover:bg-[#ffd166] text-[#235ea6] px-6 py-2 rounded-full shadow font-bold text-base transition-all"
        >
          🔓 Déconnexion
        </button>
      </div>

      {/* --- Fiche contact --- */}
      <div className="bg-white/95 rounded-3xl shadow-2xl px-4 py-6 mb-6 border border-[#e6eef8] animate-fade-in-up">
        <div className="flex flex-col sm:flex-row gap-5 items-center mb-4">
          <img
            src={avatarUrl}
            alt="avatar"
            className="w-16 h-16 rounded-full border-2 border-[#235ea6] bg-white"
          />
          <div className="flex-1 w-full">
            {edition ? (
              <input
                value={form.nom || ""}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="border border-[#e6eef8] focus:border-[#235ea6] rounded-2xl px-4 py-2 w-full mb-2 text-lg"
              />
            ) : (
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#235ea6]">
                {current.nom}
              </h3>
            )}
            <p className="text-sm text-gray-600 mb-1">{current.telephone}</p>
            <p className="text-xs text-gray-400 mb-1">
              {current.categorie_contact}
            </p>
          </div>
          <button
            onClick={() => setEdition(!edition)}
            className="text-sm text-[#235ea6] hover:text-[#fcbf49] font-bold px-3 py-2 rounded transition"
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
                  className="w-full px-3 py-2 border border-[#e6eef8] focus:border-[#235ea6] rounded-2xl transition"
                />
              )
            )}
            <button
              onClick={handleUpdateContact}
              className="bg-[#235ea6] text-white px-4 py-2 rounded-2xl hover:bg-[#174073] font-bold col-span-2 mt-2 shadow transition"
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
        <div className="my-6">
          {etatAppel === "init" && (
            <div className="flex flex-wrap gap-3">
              <a href={`tel:${current.telephone}`}>
                <button
                  onClick={() => setEtatAppel("en_cours")}
                  className="bg-[#235ea6] text-white px-6 py-2 rounded-full font-bold hover:bg-[#174073] shadow transition flex items-center gap-2"
                >
                  📞 Appeler
                </button>
              </a>
              <button
                onClick={handlePasser}
                className="bg-[#e6eef8] text-[#235ea6] px-6 py-2 rounded-full font-bold hover:bg-[#c7d8f7] shadow transition"
              >
                ⏭️ Passer
              </button>
            </div>
          )}

          {etatAppel === "en_cours" && (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleInjoignable}
                className="bg-[#fcbf49] text-[#235ea6] px-6 py-2 rounded-full font-bold hover:bg-[#ffd166] shadow transition"
              >
                ❌ Injoignable
              </button>
              <button
                onClick={() => setEtatAppel("oui")}
                className="bg-[#174073] text-white px-6 py-2 rounded-full font-bold hover:bg-[#235ea6] shadow transition"
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
                className="w-full px-4 py-2 border border-[#e6eef8] focus:border-[#235ea6] rounded-2xl mb-3 transition"
              />
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleRdv}
                  disabled={!commentaire.trim()}
                  className="bg-[#235ea6] text-white px-6 py-2 rounded-full font-bold hover:bg-[#174073] shadow transition disabled:opacity-50 flex items-center gap-1"
                >
                  📅 RDV
                </button>
                <button
                  onClick={handleValiderCommentaire}
                  disabled={!commentaire.trim()}
                  className="bg-[#e6eef8] text-[#235ea6] px-6 py-2 rounded-full font-bold hover:bg-[#c7d8f7] shadow transition disabled:opacity-50 flex items-center gap-1"
                >
                  📝 Valider
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Historique */}
        {historique.length > 0 && (
          <div className="mt-4 bg-[#fdf6ee] rounded-2xl p-4 border border-[#e6eef8]">
            <h4 className="font-extrabold mb-2 text-[#235ea6]">
              📞 Derniers appels
            </h4>
            <ul className="text-sm space-y-2">
              {historique.map((appel) => (
                <li key={appel.id} className="flex flex-col">
                  <span className="font-semibold text-[#174073]">
                    {new Date(appel.date).toLocaleDateString("fr-FR")} —{" "}
                    {appel.statut_appel}
                  </span>
                  <span className="text-[#235ea6] opacity-90">
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
