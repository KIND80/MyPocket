import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate, Navigate } from "react-router-dom";

// Mascotte (image wow)
function Mascotte() {
  return (
    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 via-white to-fuchsia-100 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center shadow-xl border-4 border-white -mt-12 mb-3">
      <img
        src="https://api.dicebear.com/7.x/pixel-art/svg?seed=John"
        alt="Mascotte"
        className="w-12 h-12"
        draggable={false}
      />
    </div>
  );
}

export default function Login({
  onLogin,
  role,
}: {
  onLogin: (role: string, userId: string) => void;
  role?: "admin" | "agent" | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const navigate = useNavigate();

  // Dark mode utilitaire
  const toggleDarkMode = () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("dark-mode", "off");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("dark-mode", "on");
    }
  };

  React.useEffect(() => {
    if (localStorage.getItem("dark-mode") === "on") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      setErrorMsg("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    const user = data.user;
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      setErrorMsg("Erreur lors de la connexion. Contactez l'administrateur.");
      setLoading(false);
      return;
    }

    setLoading(false);
    onLogin(userData.role.trim(), user.id);

    if (userData.role.trim() === "admin") {
      navigate("/admin");
    } else if (userData.role.trim() === "agent") {
      navigate("/agent");
    }
  };

  // Nouvelle gestion de reset
  const handlePasswordReset = async () => {
    setResetMsg("");
    setResetSent(false);
    if (!resetEmail) {
      setResetMsg("Veuillez entrer votre email.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(
      resetEmail.trim()
    );
    if (error) {
      setResetMsg("Erreur d'envoi : " + error.message);
    } else {
      setResetMsg(
        "✅ Un lien de réinitialisation a été envoyé sur votre email."
      );
      setResetSent(true);
    }
  };

  // ----------- Cœur de la correction : redirection safe ----------- //
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "agent") return <Navigate to="/agent" replace />;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-fuchsia-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      {/* Bandeau haut (header arrondi) */}
      <div className="w-full bg-blue-800 dark:bg-gray-900 rounded-b-3xl py-7 flex items-center justify-center shadow-lg mb-[-60px] z-10">
        <h1 className="text-2xl md:text-3xl text-white font-extrabold flex items-center gap-2 drop-shadow">
          🚀 MyPocket CRM
        </h1>
      </div>

      {/* Card principale */}
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 pt-12 flex flex-col items-center mt-[-50px] border border-blue-100 dark:border-gray-800 relative animate-fade-in-up">
        {/* Retour home */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-3 left-3 text-blue-400 dark:text-blue-300 hover:text-blue-600 dark:hover:text-white text-xs underline transition"
          style={{ zIndex: 10 }}
          tabIndex={-1}
        >
          ← Retour site
        </button>

        <Mascotte />
        <h1 className="text-2xl font-extrabold mb-1 text-blue-900 dark:text-blue-200 flex items-center justify-center gap-2 animate-fade-in">
          Bienvenue sur{" "}
          <span className="text-blue-700 dark:text-blue-400">MyPocket</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-5 text-center text-base">
          L’outil <span className="font-semibold">intelligent</span> pour gérer
          tes contacts et booster ton phoning.
        </p>
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-blue-800 dark:text-blue-400">
          <span role="img" aria-label="lock">
            🔒
          </span>
          Connexion à ton espace
        </h2>

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white font-bold py-3 rounded-2xl shadow-lg transition text-lg"
            disabled={loading}
          >
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <button
          onClick={() => setShowReset(true)}
          className="mt-3 w-full bg-yellow-400 hover:bg-yellow-500 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-gray-900 dark:text-gray-900 font-semibold py-2 rounded-2xl shadow-md transition"
          disabled={loading}
          type="button"
        >
          🔁 Réinitialiser mot de passe
        </button>

        {errorMsg && (
          <p className="text-red-600 dark:text-red-400 mt-3 text-sm font-bold">
            {errorMsg}
          </p>
        )}

        <div className="mt-7 text-center w-full">
          <span className="text-gray-500 dark:text-gray-300">
            Pas encore de compte société ?
          </span>
          <button
            onClick={() => navigate("/signup-company")}
            className="block mt-2 w-full bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-bold py-2 rounded-2xl shadow transition"
            type="button"
          >
            ➕ Créer une société et un compte admin
          </button>
        </div>

        <button
          onClick={toggleDarkMode}
          className="mt-6 w-full bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900 font-bold py-2 rounded-2xl hover:bg-black dark:hover:bg-white shadow transition"
          type="button"
        >
          🌗 Activer/Désactiver le mode sombre
        </button>
      </div>

      {/* ----------- MODALE RESET PASSWORD ---------- */}
      {showReset && (
        <div className="fixed z-50 inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-7 shadow-2xl w-full max-w-sm flex flex-col items-center relative animate-fade-in-up">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl"
              onClick={() => {
                setShowReset(false);
                setResetMsg("");
                setResetEmail("");
                setResetSent(false);
              }}
              tabIndex={-1}
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-3 dark:text-white">
              🔑 Réinitialisation du mot de passe
            </h2>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl mb-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Votre email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              autoFocus
              required
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePasswordReset();
              }}
            />
            <button
              onClick={handlePasswordReset}
              className="w-full bg-blue-600 dark:bg-blue-700 text-white font-bold py-2 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-800 transition mb-2"
              disabled={loading}
              type="button"
            >
              Envoyer le lien
            </button>
            {resetMsg && (
              <div
                className={
                  resetMsg.startsWith("✅") ? "text-green-600" : "text-red-600"
                }
              >
                {resetMsg}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
