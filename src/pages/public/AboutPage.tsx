import { useState, useEffect } from "react";
import { BookOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { dbService } from "../../services/database";

export default function AboutPage() {
  const [settings, setSettings] = useState<any>({
    siteName: "Kabu AI",
    siteDescription: "The Premium AI Research & Study Hub of Kabarak University"
  });
  const [customPage, setCustomPage] = useState<any>(null);

  useEffect(() => {
    dbService.getDocument("settings", "global").then(data => {
      if (data) setSettings(data);
    }).catch(() => {});

    dbService.getDocuments("cms_pages").then(pages => {
      const match = pages?.find((p: any) => p.slug === "about-us");
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
                  <div className="flex items-center gap-2 mb-2">
                     <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-950">
                        {sec.type}
                     </span>
                     <h3 className="font-bold text-lg text-white">{sec.heading}</h3>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">{sec.content}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-bold tracking-tight">About {settings.siteName}</h1>
            <div className="space-y-6 text-gray-400">
               <p>{settings.siteDescription || "KABU AI is a university-grade Academic Intelligence Platform built exclusively for Kabarak University."}</p>
               <p><strong>Mission:</strong> To provide a secure, source-verified academic workspace.</p>
               <p><strong>Vision:</strong> Empowering students with the tools to analyze documents, transcribe lectures, and manage continuous academic research.</p>
               <h2 className="text-2xl font-bold text-white mt-8 mb-4">Features & Integrations</h2>
               <ul className="list-disc pl-5 space-y-2">
                 <li>Document Analysis and Q&A</li>
                 <li>Live Lecture Transcription</li>
                 <li>Flashcard & Quiz Generation</li>
                 <li>Verified Knowledge Retrieval from the Library</li>
               </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
