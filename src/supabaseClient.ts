// src/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tcmvefcqiscfpnmvxqvb.supabase.co"; // Ton URL Supabase
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjbXZlZmNxaXNjZnBubXZ4cXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNjE4NjMsImV4cCI6MjA2MzgzNzg2M30.CUdwTZtU7xBL3roUIb0WxFr4yuw3v7xHyiPNQnlw6E8"; // Ta clé publique

export const supabase = createClient(supabaseUrl, supabaseKey);
//console.log(supabase);
