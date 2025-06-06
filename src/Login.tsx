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
    <div className="container text-center" style={{ maxWidth: 400 }}>
      <h1 style={{ marginBottom: 10 }}>
        👋 Bienvenue sur <strong>MyPocket</strong>
      </h1>
      <p style={{ color: "#555", marginBottom: 30 }}>
        Votre outil intelligent pour la gestion des contacts et le phoning
        efficace.
      </p>

      <h2>🔐 Connexion</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 10 }}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 10 }}
        />
        <button
          type="submit"
          className="btn"
          style={{ width: "100%" }}
          disabled={loading}
        >
          {loading ? "Connexion en cours..." : "Se connecter"}
        </button>
      </form>

      <button
        onClick={handlePasswordReset}
        className="btn btn-gray"
        style={{ marginTop: 10, width: "100%" }}
      >
        🔁 Réinitialiser mot de passe
      </button>

      {errorMsg && <p style={{ color: "red", marginTop: 15 }}>{errorMsg}</p>}
      {resetSent && (
        <p style={{ color: "green", marginTop: 15 }}>
          Lien de réinitialisation envoyé.
        </p>
      )}

      <button
        onClick={() => document.body.classList.toggle("dark-mode")}
        className="btn btn-gray"
        style={{ marginTop: 30 }}
      >
        🌗 Mode sombre
      </button>
    </div>
  );
}
