import { BookOpen, Search } from "lucide-react";
import { Link } from "react-router-dom";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link to="/" className="flex items-center gap-3 mb-12">
          <div className="bg-white p-2 rounded-xl">
             <BookOpen size={24} className="text-black" />
          </div>
          <span className="font-bold text-2xl tracking-tight leading-none">Kabu AI</span>
        </Link>
        <h1 className="text-4xl font-bold tracking-tight">Help Center</h1>
        
        <div className="relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
           <input type="text" placeholder="How can we help?" className="w-full bg-[#111] border border-[#333] pl-12 pr-4 py-4 rounded-2xl focus:border-white transition-colors outline-none text-lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {[
            { title: "Getting Started", desc: "How to log in and configure your workspace." },
            { title: "Using Chat", desc: "Tips for querying the academic knowledge base." },
            { title: "Uploading Documents", desc: "Analyzing your lecture slides and PDFs." },
            { title: "Transcription", desc: "Record and auto-transcribe live lectures." }
          ].map((item, i) => (
             <div key={i} className="p-6 bg-[#0A0A0A] border border-[#222] rounded-2xl cursor-pointer hover:border-[#444] transition-colors">
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
