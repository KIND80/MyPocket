import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate, Navigate } from "react-router-dom";

// Mascotte (image wow)
function Mascotte() {
  return (
    <div className="bg-gradient-to-br from-indigo-300 to-blue-200 rounded-full p-2 w-16 h-16 flex items-center justify-center shadow-lg animate-fade-in">
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
  const [showReset, setShowReset] = useState(false); // NEW
  const [resetEmail, setResetEmail] = useState(""); // NEW
  const [resetMsg, setResetMsg] = useState(""); // NEW
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
  let content = (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl px-8 py-10 text-center relative animate-fade-in-up">
        {/* Retour home */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-3 left-3 text-gray-400 hover:text-blue-500 text-xs underline transition"
          style={{ zIndex: 10 }}
          tabIndex={-1}
        >
          ← Retour site
        </button>

        <Mascotte />

        <h1 className="text-3xl font-extrabold mb-2 text-blue-900 dark:text-blue-200 flex items-center justify-center gap-2 animate-fade-in">
          Bienvenue sur{" "}
          <span className="text-blue-600 dark:text-blue-300">MyPocket</span>
          <span className="text-xl">✨</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-5 animate-fade-in-slow">
          L’outil <span className="font-semibold">intelligent</span> pour gérer
          tes contacts et booster ton phoning.
        </p>
        <h2 className="text-lg font-semibold mb-6 text-blue-800 dark:text-blue-200 animate-fade-in-slow">
          🔐 Connexion à ton espace
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 dark:bg-blue-700 text-white font-bold py-3 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-800 shadow transition text-lg"
            disabled={loading}
          >
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        {/* Nouvelle modale reset */}
        <button
          onClick={() => setShowReset(true)}
          className="mt-3 w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-2 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          disabled={loading}
          type="button"
        >
          🔁 Réinitialiser mot de passe
        </button>

        {errorMsg && (
          <p className="text-red-600 mt-3 animate-shake">{errorMsg}</p>
        )}
        {resetSent && (
          <p className="text-green-600 mt-3 animate-fade-in">
            ✅ Lien de réinitialisation envoyé.
          </p>
        )}

        <div className="mt-8 text-center">
          <span className="text-gray-600 dark:text-gray-300">
            Pas encore de compte société ?
          </span>
          <button
            onClick={() => navigate("/signup-company")}
            className="block mt-2 text-blue-600 dark:text-blue-300 underline font-semibold mx-auto"
            type="button"
          >
            ➕ Créer une société et un compte admin
          </button>
        </div>

        <button
          onClick={toggleDarkMode}
          className="mt-8 w-full bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 font-bold py-2 rounded-xl hover:bg-gray-900 dark:hover:bg-gray-300 shadow transition"
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
            <h2 className="text-lg font-bold mb-3">
              🔑 Réinitialisation du mot de passe
            </h2>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl mb-3 bg-white dark:bg-gray-800"
              placeholder="Votre email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              autoFocus
              required
            />
            <button
              onClick={handlePasswordReset}
              className="w-full bg-blue-600 text-white font-bold py-2 rounded-xl hover:bg-blue-700 transition mb-2"
              disabled={loading}
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

  if (role === "admin") content = <Navigate to="/admin" replace />;
  if (role === "agent") content = <Navigate to="/agent" replace />;

  return content;
}
