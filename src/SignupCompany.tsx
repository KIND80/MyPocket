import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function SignupCompany() {
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // 1. Créer la société
    const { data: companyData, error: companyError } = await supabase
      .from("companies")
      .insert({ name: company })
      .select()
      .single();

    if (companyError || !companyData) {
      setMessage("Erreur lors de la création de la société.");
      setLoading(false);
      return;
    }

    // 2. Créer le compte utilisateur (admin société)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email,
        password,
        options: {
          data: {
            name,
            company_id: companyData.id,
            role: "admin", // optionnel, selon ton modèle users
          },
        },
      }
    );

    if (signUpError) {
      setMessage(
        "Erreur lors de la création de l'utilisateur : " + signUpError.message
      );
      setLoading(false);
      return;
    }

    setMessage(
      "Compte créé ! Vérifiez vos emails pour confirmer votre inscription."
    );
    setLoading(false);
    // Tu peux rediriger automatiquement si tu veux
  };

  return (
    <form
      onSubmit={handleSignup}
      className="max-w-lg mx-auto mt-8 p-6 border rounded bg-white shadow space-y-4"
    >
      <h2 className="text-2xl font-bold mb-4">
        Créer une société & compte admin
      </h2>
      <input
        type="text"
        required
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="Nom de la société"
        className="w-full px-3 py-2 border rounded"
      />
      <input
        type="text"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Votre nom/prénom"
        className="w-full px-3 py-2 border rounded"
      />
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email de l'admin"
        className="w-full px-3 py-2 border rounded"
      />
      <input
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe"
        className="w-full px-3 py-2 border rounded"
      />
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded font-bold"
        disabled={loading}
      >
        {loading ? "Création..." : "Créer mon compte société"}
      </button>
      {message && <div className="text-center mt-2">{message}</div>}
    </form>
  );
}
