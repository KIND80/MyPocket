import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Récupère le token dans l’URL fournie par Supabase
  const params = new URLSearchParams(location.hash.replace("#", "?"));
  const accessToken =
    params.get("access_token") ||
    new URLSearchParams(window.location.search).get("access_token");

  // Peut être /reset-password#access_token=XXX OU /reset-password?access_token=XXX
  // Les deux formats sont gérés ci-dessus

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    if (!accessToken) {
      setMsg("Lien invalide ou expiré.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMsg("Erreur : " + error.message);
    } else {
      setMsg("✅ Mot de passe changé ! Redirection vers la connexion...");
      setTimeout(() => navigate("/login"), 2200);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl px-8 py-10 text-center">
        <h1 className="text-2xl font-bold mb-4 text-blue-700">
          🔒 Réinitialiser mon mot de passe
        </h1>
        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            disabled={loading}
          />
          <button
            type="submit"
            className="w-full bg-blue-600 dark:bg-blue-700 text-white font-bold py-3 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-800 shadow transition text-lg"
            disabled={loading}
          >
            {loading ? "Changement en cours..." : "Changer le mot de passe"}
          </button>
        </form>
        {msg && (
          <div
            className={`mt-4 font-bold ${
              msg.startsWith("✅") ? "text-green-600" : "text-red-600"
            }`}
          >
            {msg}
          </div>
        )}
        <div className="mt-6">
          <button
            onClick={() => navigate("/login")}
            className="text-blue-500 underline mt-2"
            type="button"
          >
            ← Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
}
