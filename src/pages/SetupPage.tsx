import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CircleAlert, Database, Key } from "lucide-react";
import { reinitializeSupabase } from "../services/supabase";

export default function SetupPage() {
  const navigate = useNavigate();
  
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [kimiKey, setKimiKey] = useState("");
  const [appUrl, setAppUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load existing items from localStorage if this is a redo
    setSupabaseUrl(localStorage.getItem('SETUP_SUPABASE_URL') || import.meta.env.VITE_SUPABASE_URL || "");
    setSupabaseKey(localStorage.getItem('SETUP_SUPABASE_ANON_KEY') || import.meta.env.VITE_SUPABASE_ANON_KEY || "");
    setGeminiKey(localStorage.getItem('SETUP_GEMINI_API_KEY') || "");
    setKimiKey(localStorage.getItem('SETUP_KIMI_API_KEY') || "");
    setAppUrl(localStorage.getItem('SETUP_APP_URL') || window.location.origin);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Basic validations
      let finalSupabaseUrl = supabaseUrl.trim() || "https://placeholder.supabase.co";
      let finalSupabaseKey = supabaseKey.trim() || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";

      if (finalSupabaseUrl !== "https://placeholder.supabase.co" && (!finalSupabaseUrl.startsWith("https://") || !finalSupabaseUrl.endsWith(".supabase.co"))) {
        throw new Error("Invalid Supabase URL format. Must start with https:// and end with .supabase.co");
      }
      if (finalSupabaseKey !== "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" && !finalSupabaseKey.startsWith("eyJ")) {
        throw new Error("Invalid Supabase Anon Key. It usually starts with eyJ.");
      }
      if (!geminiKey) {
        throw new Error("Gemini API Key is required.");
      }

      // Save to localStorage so frontend logic works
      localStorage.setItem('SETUP_SUPABASE_URL', finalSupabaseUrl);
      localStorage.setItem('SETUP_SUPABASE_ANON_KEY', finalSupabaseKey);
      localStorage.setItem('SETUP_GEMINI_API_KEY', geminiKey);
      if (kimiKey) {
         localStorage.setItem('SETUP_KIMI_API_KEY', kimiKey);
      } else {
         localStorage.removeItem('SETUP_KIMI_API_KEY');
      }
      localStorage.setItem('SETUP_APP_URL', appUrl);

      // Dynamically reinitialize Supabase for the frontend!
      reinitializeSupabase(finalSupabaseUrl, finalSupabaseKey);

      // Send Gemini Key and Kimi Key to the backend
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geminiKey, kimiKey })
      });
      if (!res.ok) throw new Error("Failed to configure server. Please check connections.");

      // Head to login
      navigate("/login");
      window.location.reload(); // Hard reload to ensure clean initialization across all files
    } catch (err: any) {
      setError(err.message || "Failed to save configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#111] border border-[#222] rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-8 pb-6 border-b border-[#222]">
          <h1 className="text-2xl font-bold mb-2 tracking-tight">Environment Setup Wizard</h1>
          <p className="text-gray-400 text-sm">
            Please provide your API keys to initialize this environment safely. Keys are securely injected during initialization.
          </p>
        </div>

        <form onSubmit={handleSave} className="p-8 flex flex-col gap-6">
          {error && (
            <div className="bg-red-950/40 border border-red-900 text-red-200 p-4 rounded-xl text-sm flex items-start gap-3">
               <CircleAlert size={18} className="mt-0.5 shrink-0" />
               <p>{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Database size={16} /> Supabase Configuration
            </h2>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">Supabase Project URL (e.g. https://xxx.supabase.co) [Optional]</label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#333] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-white transition-all text-sm"
                placeholder="Leave blank for mock database"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">Supabase Anon Key [Optional]</label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#333] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-white transition-all text-sm"
                placeholder="Leave blank for mock database"
              />
            </div>
          </div>

          <div className="h-px w-full bg-[#222] my-2"></div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Key size={16} /> Inference Engines
            </h2>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">Gemini API Key</label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#333] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-white transition-all text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">Kimi AI API Key (Optional)</label>
              <input
                type="password"
                value={kimiKey}
                onChange={(e) => setKimiKey(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#333] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-white transition-all text-sm"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-semibold py-3.5 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading ? "Initializing Environment..." : "Save Configuration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
