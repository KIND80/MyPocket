import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  // Le token de l'utilisateur pour la session recovery
  React.useEffect(() => {
    const type = searchParams.get("type");
    if (type !== "recovery") {
      setMsg("Lien de réinitialisation invalide ou expiré.");
    }
  }, [searchParams]);

  const handleReset = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      setMsg("Erreur : " + error.message);
    } else {
      setMsg("✅ Mot de passe mis à jour, redirection...");
      setTimeout(() => navigate("/login"), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">🔑 Nouveau mot de passe</h2>
        <form onSubmit={handleReset} className="space-y-3">
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            className="w-full border rounded px-3 py-2"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded font-bold"
          >
            Mettre à jour
          </button>
        </form>
        {msg && <div className="mt-4 text-center">{msg}</div>}
      </div>
    </div>
  );
}
