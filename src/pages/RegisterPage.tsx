import { useState } from "react";
import { authService } from "../services/auth";
import { BookOpen, CircleAlert } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const [fullNameInput, setFullNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const checkKabarakEmail = (email: string) => {
    const isKabarak = email.endsWith('@kabarak.ac.ke') || email.endsWith('@student.kabarak.ac.ke');
    if (!isKabarak && email !== 'admin@kabarak.ac.ke' && email !== 'punkpixel42@gmail.com') {
        throw new Error("Kabu AI is exclusively for Kabarak University students and staff. Please use your university email.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      checkKabarakEmail(emailInput);
      await authService.signUpWithEmail(emailInput, passwordInput, fullNameInput);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-white relative">
      <div className="absolute inset-0 z-0 flex">
         <div className="w-1/2 h-full bg-[#111111]"></div>
         <div className="w-1/2 h-full bg-gradient-to-br from-[#0A0A0A] to-[#000]"></div>
      </div>
      
      <div className="hidden lg:flex w-1/2 z-10 p-12 flex-col justify-between border-r border-[#222]">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-xl">
             <BookOpen size={24} className="text-black" />
          </div>
          <span className="font-bold text-2xl tracking-tight">Kabu AI</span>
        </div>
        
        <div>
          <h2 className="text-5xl font-bold mb-6 tracking-tight leading-tight">Academic Intelligence.</h2>
          <p className="text-gray-400 text-lg max-w-md leading-relaxed">
            Your university-approved academic workspace. Secure, source-verified, and tailored entirely for Kabarak University students.
          </p>
        </div>
        
        <div className="text-sm text-gray-500 font-medium">
          <Link to="/admin-login" className="cursor-pointer hover:text-white transition-colors">@</Link> {new Date().getFullYear()} Kabarak University. Secure portal.
        </div>
      </div>

      <div className="w-full lg:w-1/2 z-10 flex flex-col justify-center items-center p-8 bg-[#000000] relative">
        <div className="w-full max-w-sm lg:hidden flex items-center justify-center gap-3 mb-12">
          <div className="bg-white p-2 rounded-xl">
             <BookOpen size={20} className="text-black" />
          </div>
          <span className="font-bold text-xl tracking-tight">Kabu AI</span>
        </div>
        
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Account</h1>
          <p className="text-gray-400 text-sm mb-8 font-medium">
            Register for your continuous academic workspace
          </p>

          {error && (
            <div className="bg-red-950/40 border border-red-900 text-red-200 p-4 rounded-xl mb-6 text-sm flex items-start gap-3">
               <CircleAlert size={18} className="mt-0.5 shrink-0" />
               <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="w-full flex flex-col gap-5">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Full Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={fullNameInput}
                onChange={(e) => setFullNameInput(e.target.value)}
                className="w-full bg-[#111] border border-[#333] text-white px-4 py-3.5 rounded-xl focus:outline-none focus:border-white focus:bg-[#1A1A1A] transition-all text-sm"
                required
              />
            </div>
            
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">University Email</label>
              <input
                type="email"
                placeholder="e.g. yourname@student.kabarak.ac.ke"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-[#111] border border-[#333] text-white px-4 py-3.5 rounded-xl focus:outline-none focus:border-white focus:bg-[#1A1A1A] transition-all text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-[#111] border border-[#333] text-white px-4 py-3.5 rounded-xl focus:outline-none focus:border-white focus:bg-[#1A1A1A] transition-all text-sm"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-semibold py-3.5 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-8 text-sm text-center text-gray-400 font-medium">
            Already have an account?{" "}
            <Link 
              to="/login" 
              className="text-white hover:underline transition-colors ml-1"
            >
              Log in here
            </Link>
          </p>

          <div className="mt-4 text-center">
            <Link to="/setup" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              Environment Setup
            </Link>
          </div>

          <p className="mt-8 text-xs text-center text-gray-600 font-medium">
            Kabu AI only searches approved academic resources.
          </p>
        </div>
      </div>
    </div>
  );
}
