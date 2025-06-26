import React from "react";
import { useNavigate } from "react-router-dom";

// ----------- HERO et SECTIONS ----------- //
export default function LandingPage({ role }: { role: string | null }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 via-white to-blue-50 font-sans">
      {/* HEADER / HERO */}
      <header className="py-16 px-4 md:px-0 flex flex-col items-center justify-center text-center relative">
        <div className="w-full max-w-2xl bg-blue-800 rounded-3xl mx-auto py-7 flex items-center justify-center shadow-lg mb-8">
          <h1 className="text-3xl md:text-4xl text-white font-extrabold flex items-center gap-2 drop-shadow">
            🚀 MyPocket&nbsp;
            <span className="text-yellow-300 font-black drop-shadow">
              CRM Phoning
            </span>
          </h1>
        </div>

        <h2 className="text-lg md:text-2xl text-blue-900 max-w-2xl mx-auto mb-2 font-bold">
          Le CRM suisse nouvelle génération pour booster la prospection
          <br />
          <span className="text-base font-normal">
            et protéger vos données.
          </span>
        </h2>

        <p className="text-md md:text-lg text-blue-900 max-w-2xl mx-auto mb-8">
          Développé par un expert du phoning et du terrain, MyPocket CRM répond
          aux besoins réels des équipes commerciales.
          <br />
          <span className="font-bold text-blue-700">
            Notre objectif : offrir la solution la plus simple, performante et
            sécurisée du marché.
          </span>
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center mb-2">
          <button
            className="px-8 py-3 bg-gradient-to-r from-blue-700 to-blue-500 text-white font-bold rounded-2xl text-xl shadow hover:scale-105 transition-all hover:from-yellow-400 hover:to-yellow-300 hover:text-blue-900"
            onClick={() => navigate("/signup-company")}
          >
            ➕ Créer ma société
          </button>
          <button
            className="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold rounded-2xl text-xl shadow hover:scale-105 transition-all border border-yellow-300"
            onClick={() => navigate("/login")}
          >
            🔑 Se connecter
          </button>
        </div>

        <span className="mt-6 inline-block text-gray-400 italic text-sm">
          SaaS 🇨🇭 Swiss made • Données hébergées et protégées en Suisse • Essai
          gratuit
        </span>
      </header>

      {/* ABOUT */}
      <section className="max-w-3xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-3 text-blue-900">
          Pourquoi MyPocket ?
        </h2>
        <p className="mb-4 text-blue-900">
          Les CRM classiques sont souvent{" "}
          <span className="font-bold">
            complexes, mal adaptés à la réalité terrain, et peu sécurisés
          </span>
          .
          <br />
          <span className="text-blue-700 font-semibold">
            MyPocket CRM révolutionne la gestion des portefeuilles :
          </span>
        </p>
        <ul className="grid sm:grid-cols-2 gap-3 text-left max-w-2xl mx-auto mb-4">
          <li>✅ Simple à prendre en main</li>
          <li>✅ Pensé pour la prospection téléphonique et physique</li>
          <li>
            ✅ Mutualisation intelligente des contacts : chaque lead est traité
          </li>
          <li>
            ✅ Sécurité totale : vos données restent chez vous, impossibles à
            extraire
          </li>
        </ul>
      </section>

      {/* AVANTAGES */}
      <section className="max-w-6xl mx-auto px-4 py-4 grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl shadow-xl p-7 flex flex-col gap-2 border border-blue-100">
          <h3 className="text-xl font-bold text-blue-800 mb-2">
            Avantages clés
          </h3>
          <ul className="space-y-1 text-blue-900">
            <li>
              ✔️ Conçu par un commercial pour les commerciaux – 10 ans
              d’expérience terrain en Suisse
            </li>
            <li>
              ✔️ Protection des données – Aucun agent ne peut exporter la base
              clients
            </li>
            <li>
              ✔️ Mutualisation du portefeuille – Aucun contact oublié, chaque
              lead traité
            </li>
            <li>
              ✔️ Suivi des performances – Statistiques détaillées pour les
              admins
            </li>
          </ul>
        </div>
        {/* FONCTIONNALITES */}
        <div className="bg-white rounded-3xl shadow-xl p-7 flex flex-col gap-2 border border-blue-100">
          <h3 className="text-xl font-bold text-blue-800 mb-2">
            Fonctionnalités principales
          </h3>
          <ul className="space-y-1 text-blue-900">
            <li>🗂️ Gestion centralisée des contacts et historiques d’appels</li>
            <li>📅 Prise de RDV, rappels et relances automatiques</li>
            <li>📊 Statistiques avancées (agents, admins, équipes)</li>
            <li>🔄 Attribution dynamique des portefeuilles</li>
            <li>📱 Interface moderne, mobile & desktop</li>
          </ul>
        </div>
      </section>

      {/* PORTFOLIO/SCREENSHOTS */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-blue-800 mb-3 text-center">
          MyPocket en action
        </h2>
        <div className="flex flex-wrap gap-5 justify-center">
          {/* Remplace par tes screenshots réels */}
          <div className="w-64 h-40 bg-blue-100 rounded-xl flex flex-col items-center justify-center shadow border border-blue-200">
            <span className="text-blue-700 font-bold mb-2">
              Dashboard Admin
            </span>
            <span className="text-gray-400 text-sm"></span>
          </div>
          <div className="w-64 h-40 bg-blue-100 rounded-xl flex flex-col items-center justify-center shadow border border-blue-200">
            <span className="text-blue-700 font-bold mb-2">
              Vue Agent / Fiche client
            </span>
            <span className="text-gray-400 text-sm"></span>
          </div>
          <div className="w-64 h-40 bg-blue-100 rounded-xl flex flex-col items-center justify-center shadow border border-blue-200">
            <span className="text-blue-700 font-bold mb-2">Stats & Suivi</span>
            <span className="text-gray-400 text-sm"></span>
          </div>
        </div>
      </section>

      {/* PRICING / ARGUMENTAIRE */}
      <section className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h3 className="text-xl font-bold text-blue-800 mb-2">
            Pourquoi choisir MyPocket ?
          </h3>
          <ul className="space-y-1 text-blue-900">
            <li>✅ Facile à déployer, prise en main immédiate</li>
            <li>
              ✅ Abonnement flexible :{" "}
              <span className="font-bold text-blue-700">
                200 CHF/mois/5 agents
              </span>
            </li>
            <li>
              ✅ Ou licence annuelle{" "}
              <span className="font-bold text-blue-700">en marque blanche</span>
            </li>
            <li>✅ 100% Swiss made, hébergement sécurisé, respect RGPD</li>
            <li>✅ Support humain, accompagnement personnalisé</li>
          </ul>
        </div>
        <div className="bg-yellow-100 rounded-3xl p-6 text-blue-900 shadow border border-yellow-300">
          <h4 className="text-lg font-bold mb-1 text-yellow-800">
            Nos services
          </h4>
          <ul className="mb-3">
            <li>🚀 Déploiement sur-mesure pour chaque entreprise</li>
            <li>🔌 Intégration rapide à vos outils (Google Agenda, Excel…)</li>
            <li>🤝 Accompagnement pendant toute la phase beta</li>
          </ul>
        </div>
      </section>

      {/* NEWS / BETA TESTEURS */}
      <section className="max-w-3xl mx-auto px-4 py-8 text-center">
        <h3 className="text-xl font-bold mb-3 text-blue-800">
          🚨 Rejoignez la phase beta !
        </h3>
        <p className="text-blue-900 mb-3">
          Accès anticipé{" "}
          <span className="font-semibold text-yellow-700">gratuit</span> pour
          les entreprises partenaires.
          <br />
          <span className="text-blue-700 font-bold">
            Vos retours influencent directement l’outil.
          </span>
          <br />
          Valorisez votre société comme partenaire innovant !
        </p>
        <button
          className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-blue-600 text-blue-900 font-bold rounded-2xl text-lg shadow hover:scale-105 transition-all hover:from-blue-700 hover:to-yellow-400 hover:text-white animate-bounce"
          onClick={() => navigate("/signup-company")}
        >
          🚀 Demander un accès beta
        </button>
      </section>

      {/* FOOTER */}
      <footer className="w-full text-center py-6 text-gray-400 bg-white border-t">
        © {new Date().getFullYear()} MyPocket — Swiss made, développé avec 💙
        pour les équipes de phoning et courtiers modernes.
      </footer>
    </div>
  );
}
