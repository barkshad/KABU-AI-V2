import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function FaqPage() {
  const faqs = [
    { q: "Is KABU AI free?", a: "Yes, KABU AI is a free tool provided for verified Kabarak University students." },
    { q: "How is my data used?", a: "Your workspace is private. Documents and chats are isolated to your account and never used for global model training." },
    { q: "Can I use external internet sources?", a: "By default, KABU AI prioritizes the university repository and uploaded resources over external web searches." },
    { q: "I lost my old chat. Where is it?", a: "All conversations and analyzed documents are automatically saved in your Bookmarks and Recent Chats in the Workspace." }
  ];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link to="/" className="flex items-center gap-3 mb-12">
          <div className="bg-white p-2 rounded-xl">
             <BookOpen size={24} className="text-black" />
          </div>
          <span className="font-bold text-2xl tracking-tight leading-none">Kabu AI</span>
        </Link>
        <h1 className="text-4xl font-bold tracking-tight">Frequently Asked Questions</h1>
        
        <div className="space-y-4">
           {faqs.map((f, i) => (
             <div key={i} className="p-6 bg-[#0A0A0A] border border-[#222] rounded-2xl">
                <h3 className="font-semibold text-lg mb-2">{f.q}</h3>
                <p className="text-gray-400 leading-relaxed">{f.a}</p>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
