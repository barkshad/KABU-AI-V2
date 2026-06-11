import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { dbService } from "../../services/database";

export default function FaqPage() {
  const [settings, setSettings] = useState<any>({
    siteName: "Kabu AI"
  });
  const [customPage, setCustomPage] = useState<any>(null);

  const defaultFaqs = [
    { q: "Is KABU AI free?", a: "Yes, KABU AI is a free tool provided for verified Kabarak University students." },
    { q: "How is my data used?", a: "Your workspace is private. Documents and chats are isolated to your account and never used for global training." },
    { q: "Can I use external internet sources?", a: "By default, KABU AI prioritizes the university repository and uploaded resources over external web searches." },
    { q: "I lost my old chat. Where is it?", a: "All conversations and analyzed documents are automatically saved in your Bookmarks and Recent Chats in the Workspace." }
  ];

  useEffect(() => {
    dbService.getDocument("settings", "global").then(data => {
      if (data) setSettings(data);
    }).catch(() => {});

    dbService.getDocuments("cms_pages").then(pages => {
      const match = pages?.find((p: any) => p.slug === "faq");
      if (match) setCustomPage(match);
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <Link to="/" className="flex items-center gap-3 mb-12">
          <div className="bg-white p-2 rounded-xl">
             <BookOpen size={24} className="text-black" />
          </div>
          <span className="font-bold text-2xl tracking-tight leading-none">{settings.siteName}</span>
        </Link>

        {customPage ? (
          <div className="space-y-8">
            <h1 className="text-4xl font-bold tracking-tight">{customPage.title}</h1>
            <div className="space-y-6">
              {(customPage.sections || []).map((sec: any) => (
                <div key={sec.id} className="p-6 bg-[#0A0A0A] border border-[#222] rounded-2xl">
                  <h3 className="font-semibold text-lg mb-2 text-white">{sec.heading}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{sec.content}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-bold tracking-tight">Frequently Asked Questions</h1>
            <div className="space-y-4">
               {defaultFaqs.map((f, i) => (
                 <div key={i} className="p-6 bg-[#0A0A0A] border border-[#222] rounded-2xl">
                    <h3 className="font-semibold text-lg mb-2">{f.q}</h3>
                    <p className="text-gray-400 leading-relaxed text-sm">{f.a}</p>
                 </div>
               ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
