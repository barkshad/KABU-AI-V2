import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link to="/" className="flex items-center gap-3 mb-12">
          <div className="bg-white p-2 rounded-xl">
             <BookOpen size={24} className="text-black" />
          </div>
          <span className="font-bold text-2xl tracking-tight leading-none">Kabu AI</span>
        </Link>
        <h1 className="text-4xl font-bold tracking-tight">Contact Support</h1>
        <form className="space-y-6 max-w-xl">
          <div>
             <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Name</label>
             <input type="text" className="w-full bg-[#111] border border-[#333] px-4 py-3 rounded-xl focus:border-white transition-colors outline-none" required />
          </div>
          <div>
             <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Email</label>
             <input type="email" className="w-full bg-[#111] border border-[#333] px-4 py-3 rounded-xl focus:border-white transition-colors outline-none" required />
          </div>
          <div>
             <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Message</label>
             <textarea rows={5} className="w-full bg-[#111] border border-[#333] px-4 py-3 rounded-xl focus:border-white transition-colors outline-none" required></textarea>
          </div>
          <button type="button" className="bg-white text-black font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors">Send Message</button>
        </form>
      </div>
    </div>
  );
}
