import { useState } from "react";
import { authService } from "../../services/auth";
import { ShieldAlert, Terminal } from "lucide-react";

export default function AdminLoginPage() {
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!emailInput.includes('admin')) {
      setError("unauthorized_access_attempt");
      return;
    }

    setLoading(true);

    try {
      await authService.loginWithEmail(emailInput);
      setSuccess("MAGIC_LINK_DISPATCHED");
    } catch (err: any) {
      setError(err.message || "authentication_failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono flex items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f0f0f_1px,transparent_1px),linear-gradient(to_bottom,#0f0f0f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

      <div className="w-full max-w-lg z-10 p-8 border border-green-900/30 bg-[#050505] shadow-[0_0_40px_rgba(0,255,0,0.05)]">
        <div className="flex items-center gap-3 mb-8 border-b border-green-900/30 pb-6 uppercase tracking-widest text-xs">
          <Terminal size={18} />
          <span>Kabu_AI // System_Access</span>
        </div>

        <h1 className="text-2xl font-bold mb-8 text-white tracking-widest uppercase">Admin Terminal</h1>

        {error && (
          <div className="bg-red-950/20 border border-red-900 text-red-500 p-4 mb-8 text-sm flex items-center gap-3 font-mono">
            <ShieldAlert size={16} />
            <span>ERR: {error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-950/20 border border-green-900 text-green-400 p-4 mb-8 text-sm flex items-center gap-3 font-mono">
            <Terminal size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleAdminAuth} className="flex flex-col gap-6">
          <div>
            <label className="text-xs uppercase tracking-widest text-green-700 block mb-3">&gt; Input_Admin_Email =</label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="admin@kabarak.ac.ke"
              className="w-full bg-black border border-green-900/50 text-green-400 px-4 py-3 focus:outline-none focus:border-green-500 transition-all font-mono"
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full bg-green-900/20 border border-green-900 text-green-500 hover:bg-green-900/40 hover:text-green-400 uppercase tracking-widest text-sm font-bold py-4 transition-all mt-4 disabled:opacity-50"
          >
            {loading ? "EXECUTING_AUTH..." : "INITIALIZE_CONNECTION"}
          </button>
        </form>

        <div className="mt-12 text-[10px] text-green-900 uppercase tracking-widest text-center">
            Restricted System Area. Logged connections only.
        </div>
      </div>
    </div>
  );
}
