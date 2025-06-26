import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";

export default function SignupCompany() {
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const navigate = useNavigate();

  const isFormValid =
    company.trim().length > 0 &&
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    password === confirmPassword;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setMessage({
        type: "error",
        text: "Veuillez remplir correctement tous les champs.",
      });
      return;
    }
    setLoading(true);
    setMessage(null);

    // 1. Créer la société
    const { data: companyData, error: companyError } = await supabase
      .from("companies")
      .insert({ name: company.trim() })
      .select()
      .single();

    if (companyError || !companyData) {
      setMessage({
        type: "error",
        text: "Erreur lors de la création de la société.",
      });
      setLoading(false);
      return;
    }

    // 2. Créer le compte utilisateur (admin société)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
            company_id: companyData.id,
            role: "admin",
          },
        },
      }
    );

    if (signUpError) {
      setMessage({
        type: "error",
        text: "Erreur création utilisateur : " + signUpError.message,
      });
      setLoading(false);
      return;
    }

    // 3. Ajouter dans la table users (logique métier)
    if (signUpData?.user?.id) {
      const { error: userError } = await supabase.from("users").insert({
        id: signUpData.user.id,
        email: email.trim(),
        name: name.trim(),
        company_id: companyData.id,
        role: "admin",
      });

      if (userError) {
        setMessage({
          type: "error",
          text: "Erreur ajout user en base : " + userError.message,
        });
        setLoading(false);
        return;
      }
    }

    setMessage({
      type: "success",
      text: "Compte créé ! Vérifiez vos emails pour confirmer.",
    });
    setLoading(false);

    // Redirection automatique après 3 secondes
    setTimeout(() => navigate("/login"), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-50">
      {/* Header façon landing */}
      <div className="w-full max-w-lg bg-blue-800 rounded-3xl mx-auto py-7 flex items-center justify-center shadow-lg mb-[-60px] z-10">
        <h1 className="text-2xl md:text-3xl text-white font-extrabold flex items-center gap-2 drop-shadow">
          🚀 Créer mon espace MyPocket
        </h1>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 pt-12 flex flex-col items-center mt-[-50px] border border-blue-100 relative animate-fade-in-up">
        <button
          onClick={() => navigate("/login")}
          className="absolute top-3 left-3 text-blue-400 hover:text-blue-600 text-xs underline transition"
          tabIndex={-1}
        >
          ← Retour à la connexion
        </button>

        <h2 className="text-2xl font-extrabold text-center text-blue-800 mb-4">
          Créer une société & compte admin
        </h2>

        {message && (
          <div
            className={`p-3 rounded-2xl text-center font-semibold mb-3 ${
              message.type === "error"
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSignup} className="w-full space-y-4">
          <input
            type="text"
            placeholder="Nom de la société"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
            className="w-full px-4 py-3 border border-blue-200 rounded-xl bg-blue-50 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            disabled={loading}
            autoFocus
          />

          <input
            type="text"
            placeholder="Votre nom/prénom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 border border-blue-200 rounded-xl bg-blue-50 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            disabled={loading}
          />

          <input
            type="email"
            placeholder="Email de l'admin"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-blue-200 rounded-xl bg-blue-50 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Mot de passe (8 caractères minimum)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-4 py-3 border border-blue-200 rounded-xl bg-blue-50 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            disabled={loading}
            autoComplete="new-password"
          />

          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-4 py-3 border border-blue-200 rounded-xl bg-blue-50 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            disabled={loading}
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={!isFormValid || loading}
            className={`w-full py-3 rounded-2xl font-bold text-white transition text-lg shadow ${
              isFormValid && !loading
                ? "bg-blue-700 hover:bg-yellow-400 hover:text-blue-900"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {loading ? "Création en cours..." : "Créer mon compte société"}
          </button>
        </form>
      </div>
    </div>
  );
}
