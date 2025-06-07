import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login({
  onLogin,
}: {
  onLogin: (role: string, userId: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("Erreur de connexion : " + error.message);
      setLoading(false);
      return;
    }

    const user = data.user;
    if (!user) {
      setErrorMsg("Utilisateur introuvable.");
      setLoading(false);
      return;
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      setErrorMsg("Impossible de récupérer le rôle.");
      setLoading(false);
      return;
    }

    setLoading(false);
    onLogin(userData.role, user.id);
  };

  const handlePasswordReset = async () => {
    setErrorMsg("");
    setResetSent(false);
    if (!email) {
      setErrorMsg("Veuillez entrer votre email pour réinitialiser.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setErrorMsg("Erreur d'envoi : " + error.message);
    } else {
      setResetSent(true);
    }
  };

  return (
    <div className="max-w-sm mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-2">👋 Bienvenue sur <span className="text-blue-600">MyPocket</span></h1>
      <p className="text-gray-600 mb-6">
        Votre outil intelligent pour la gestion des contacts et le phoning efficace.
      </p>

      <h2 className="text-lg font-semibold mb-4">🔐 Connexion</h2>

      <form onSubmit={handleLogin} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          className="w-full px-3 py-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          className="w-full px-3 py-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Connexion en cours..." : "Se connecter"}
        </button>
      </form>

      <button
        onClick={handlePasswordReset}
        className="mt-3 w-full bg-gray-300 text-gray-800 font-semibold py-2 rounded hover:bg-gray-400"
      >
        🔁 Réinitialiser mot de passe
      </button>

      {errorMsg && <p className="text-red-600 mt-3">{errorMsg}</p>}
      {resetSent && (
        <p className="text-green-600 mt-3">
          ✅ Lien de réinitialisation envoyé.
        </p>
      )}

      <button
        onClick={() => document.body.classList.toggle("dark-mode")}
        className="mt-8 w-full bg-gray-700 text-white font-semibold py-2 rounded hover:bg-gray-800"
      >
        🌗 Activer/Désactiver le mode sombre
      </button>
    </div>
  );
}
