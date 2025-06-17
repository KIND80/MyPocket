import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import Papa from "papaparse";

export default function ImportCSV({
  entrepriseId,
  onSuccess,
}: {
  entrepriseId: string;
  onSuccess?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Champs standards de ta table
  const standardFields = [
    { nom: "nom", label: "Nom" },
    { nom: "telephone", label: "Téléphone" },
    { nom: "adresse", label: "Adresse" },
    { nom: "type_assurance", label: "Type assurance" },
    { nom: "categorie_contact", label: "Catégorie contact" },
    { nom: "canton", label: "Canton" },
    // ajoute ici les autres champs standards si besoin
  ];

  // Champs requis pour la création d’un contact
  const requiredFields = ["nom", "telephone"];

  // Lecture du CSV
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMsg(null);
    const file = e.target.files?.[0];
    setFile(file || null);
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setCsvData(results.data as any[]);
          setCsvColumns(results.meta.fields || []);
        },
      });
    }
  };

  // Mapping
  const handleMappingChange = (csvCol: string, field: string) => {
    setMapping((prev) => ({
      ...prev,
      [csvCol]: field,
    }));
  };

  // Import dans Supabase
  const handleImport = async () => {
    setLoading(true);
    setMsg(null);

    // Vérifie le mapping des champs requis
    const isMappingValid = requiredFields.every((field) =>
      Object.values(mapping).includes(field)
    );
    if (!isMappingValid) {
      setMsg(
        "❌ Merci d’associer toutes les colonnes obligatoires (“nom” et “téléphone”) avant d’importer."
      );
      setLoading(false);
      return;
    }

    try {
      // On prépare tous les contacts à insérer d'un coup
      const contactsToInsert = csvData.map((row) => {
        const contactPayload: any = {
          company_id: entrepriseId,
          statut: "non_assigné",
          visible_globally: true,
        };
        for (const field of standardFields) {
          const csvCol = Object.keys(mapping).find(
            (col) => mapping[col] === field.nom
          );
          if (csvCol) contactPayload[field.nom] = row[csvCol] || "";
        }
        return contactPayload;
      });

      // Insert en bulk pour aller plus vite !
      const { error } = await supabase
        .from("contacts")
        .insert(contactsToInsert);

      if (error) throw new Error(error.message);

      setMsg("✅ Importation réussie !");
      setFile(null);
      setCsvData([]);
      setCsvColumns([]);
      setMapping({});
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setMsg(err.message || "❌ Erreur lors de l'import.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 animate-fade-in-up">
      {/* Header visuel */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-br from-blue-200 to-purple-200 rounded-full p-3 shadow">
          <span className="text-2xl">📥</span>
        </div>
        <h2 className="text-2xl font-extrabold text-blue-900 dark:text-blue-200">
          Importer des contacts (CSV)
        </h2>
      </div>

      {/* 1. Upload fichier */}
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="mb-4 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
        disabled={loading}
      />

      {/* 2. Mapping */}
      {csvColumns.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-200">
            👉 Associe chaque colonne CSV à un champ
          </h3>
          <table className="w-full border text-sm rounded-xl bg-gray-50 dark:bg-gray-800">
            <thead>
              <tr>
                <th className="p-2 border">Colonne CSV</th>
                <th className="p-2 border">Champ à importer</th>
              </tr>
            </thead>
            <tbody>
              {csvColumns.map((col) => (
                <tr key={col}>
                  <td className="p-2 border">{col}</td>
                  <td className="p-2 border">
                    <select
                      value={mapping[col] || ""}
                      onChange={(e) => handleMappingChange(col, e.target.value)}
                      className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-900"
                    >
                      <option value="">— Ignorer —</option>
                      {standardFields.map((f) => (
                        <option key={f.nom} value={f.nom}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Aperçu */}
      {csvData.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-200">
            Aperçu des 5 premiers contacts
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-xs bg-white dark:bg-gray-800 rounded-xl">
              <thead>
                <tr>
                  {csvColumns.map((col) => (
                    <th key={col} className="p-1 border">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {csvColumns.map((col) => (
                      <td key={col} className="p-1 border">
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Bouton d’import */}
      {csvColumns.length > 0 && (
        <button
          onClick={handleImport}
          className="w-full bg-blue-600 dark:bg-blue-700 text-white font-bold py-3 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-800 transition text-lg flex items-center justify-center gap-2"
          disabled={loading || csvData.length === 0}
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span> Import en cours...
            </>
          ) : (
            <>
              <span>📤</span> Importer les contacts
            </>
          )}
        </button>
      )}

      {/* Message feedback */}
      {msg && (
        <div
          className={`mt-4 text-center font-semibold ${
            msg.startsWith("✅")
              ? "text-green-600 animate-fade-in"
              : "text-red-600 animate-shake"
          }`}
        >
          {msg}
        </div>
      )}
    </div>
  );
}
