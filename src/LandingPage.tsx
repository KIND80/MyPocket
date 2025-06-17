import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage({ role }: { role: string | null }) {
  const navigate = useNavigate();

  // Si déjà connecté, redirige automatiquement (pro)
  useEffect(() => {
    if (role === "admin") navigate("/admin");
    if (role === "agent") navigate("/agent");
    // eslint-disable-next-line
  }, [role]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-violet-100 font-sans">
      {/* HERO */}
      <header className="py-14 px-4 md:px-0 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl md:text-6xl font-black mb-4 text-gray-900 leading-tight drop-shadow-sm">
          🚀 MyPocket&nbsp;
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-fuchsia-600">
            Le CRM Phoning <br className="hidden md:block" />
            Ultra-Intelligent
          </span>
        </h1>
        <p className="text-lg md:text-2xl text-gray-600 max-w-2xl mx-auto mb-8">
          La solution tout-en-un pour équipes de prospection et sociétés
          ambitieuses.
          <br />
          Multi-entreprise, customisable, ultra-mobile, sécurisée,{" "}
          <span className="font-bold text-blue-600">
            prête à booster votre business !
          </span>
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-fuchsia-600 text-white font-bold rounded-2xl text-xl shadow hover:scale-105 transition-all hover:from-fuchsia-600 hover:to-blue-600"
            onClick={() => navigate("/signup-company")}
          >
            ➕ Créer ma société
          </button>
          <button
            className="px-8 py-3 bg-white border border-blue-500 text-blue-700 font-bold rounded-2xl text-xl shadow hover:bg-blue-50 transition-all"
            onClick={() => navigate("/login")}
          >
            🔑 Se connecter
          </button>
        </div>
        <span className="mt-8 inline-block text-gray-400 italic text-sm">
          SaaS 🇫🇷 hébergé en Europe • Données 100% sécurisées • Essai gratuit
        </span>
        <div className="mt-10 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 max-w-2xl mx-auto text-sm text-gray-700">
          <strong>ℹ️ À savoir :</strong> Aujourd'hui{" "}
          <span className="font-semibold text-blue-600">
            MyPocket est conçu spécialement pour les pros de l’assurance
          </span>{" "}
          (courtage, mutuelle, protection sociale, etc.) — mais la plateforme{" "}
          <span className="font-semibold text-fuchsia-600">
            va évoluer pour d’autres secteurs (immobilier, énergie, recrutement,
            etc.)
          </span>{" "}
          avec de nouvelles fonctionnalités.
          <br />
          <span>
            👉 Vous voulez rester informé ou proposer une idée ?{" "}
            <a
              href="mailto:contact@monfideleconseiller.ch"
              className="text-blue-600 underline font-bold"
            >
              Contactez-nous !
            </a>
          </span>
        </div>
      </header>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
        <Feature
          icon="🏢"
          title="Multi-entreprises"
          desc="Chaque société a son espace privé, ses agents, ses contacts, ses règles. Parfait pour le B2B, franchises, réseaux."
        />
        <Feature
          icon="📞"
          title="Phoning intelligent"
          desc="Assignation intelligente des prospects, historique complet, suivi, relances, et stats automatiques pour chaque agent."
        />
        <Feature
          icon="⚡"
          title="100% Personnalisable"
          desc="Champs dynamiques, import CSV magique, gestion fine des accès : vous adaptez MyPocket à vos process."
        />
        <Feature
          icon="🔒"
          title="Sécurité totale"
          desc="Données chiffrées, accès strict par société, politiques RLS vérifiées, RGPD-ready."
        />
        <Feature
          icon="📱"
          title="Ultra-mobile"
          desc="Expérience fluide sur mobile, tablette ou desktop. Vos agents travaillent où ils veulent."
        />
      </section>

      {/* CTA + Footer */}
      <section className="flex flex-col items-center my-12">
        <button
          className="px-10 py-4 bg-gradient-to-r from-fuchsia-600 to-blue-600 text-white font-black rounded-2xl text-2xl shadow-lg hover:scale-105 transition-all animate-bounce"
          onClick={() => navigate("/signup-company")}
        >
          🚀 Démarrer l'essai gratuit maintenant
        </button>
        <p className="mt-6 text-gray-500 text-lg">
          Questions ?{" "}
          <a
            className="text-blue-600 underline"
            href="mailto:contact@monfideleconseiller.ch"
          >
            Contactez-nous
          </a>
        </p>
      </section>

      <footer className="w-full text-center py-6 text-gray-400 bg-white border-t">
        © {new Date().getFullYear()} MyPocket — Développé avec 💙 pour les
        équipes de phoning et courtiers modernes.
      </footer>
    </div>
  );
}

// Petit composant feature (pour factoriser)
function Feature({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center border border-blue-100 hover:scale-105 transition-all">
      <span className="text-4xl mb-3">{icon}</span>
      <h3 className="text-xl font-bold mb-2 text-blue-600">{title}</h3>
      <p className="text-gray-600">{desc}</p>
    </div>
  );
}
