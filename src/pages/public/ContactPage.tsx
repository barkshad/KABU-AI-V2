import { useState, useEffect } from "react";
import { BookOpen, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { dbService } from "../../services/database";

export default function ContactPage() {
  const [settings, setSettings] = useState<any>({
    siteName: "Kabu AI",
    contactEmail: "support@kabarak.ac.ke",
    contactPhone: "+254 700 000000"
  });
  const [customPage, setCustomPage] = useState<any>(null);

  useEffect(() => {
    dbService.getDocument("settings", "global").then(data => {
      if (data) setSettings(data);
    }).catch(() => {});

    dbService.getDocuments("cms_pages").then(pages => {
      const match = pages?.find((p: any) => p.slug === "contact-us");
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
                  <h3 className="font-bold text-lg text-white mb-2">{sec.heading}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{sec.content}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-bold tracking-tight">Contact Support</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <form className="space-y-6 max-w-xl">
                <div>
                   <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Name</label>
                   <input type="text" className="w-full bg-[#111] border border-[#333] px-4 py-3 rounded-xl focus:border-white transition-colors outline-none text-white text-sm" required />
                </div>
                <div>
                   <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Email</label>
                   <input type="email" className="w-full bg-[#111] border border-[#333] px-4 py-3 rounded-xl focus:border-white transition-colors outline-none text-white text-sm" required />
                </div>
                <div>
                   <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Message</label>
                   <textarea rows={5} className="w-full bg-[#111] border border-[#333] px-4 py-3 rounded-xl focus:border-white transition-colors outline-none text-white text-sm" required></textarea>
                </div>
                <button type="button" className="bg-white text-black font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors shadow">Send Message</button>
              </form>

              <div className="bg-[#0A0A0A] border border-[#222] rounded-2xl p-6 self-start space-y-6">
                <h3 className="text-lg font-semibold text-white">Institutional Channels</h3>
                <p className="text-sm text-gray-400">Reach the Kabarak University support teams directly.</p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-amber-500">
                      <Mail size={16} />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase block font-bold">Email Desk</span>
                      <a href={`mailto:${settings.contactEmail}`} className="text-xs font-semibold text-white hover:underline">{settings.contactEmail}</a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-amber-500">
                      <Phone size={16} />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase block font-bold">Hotline Telephone</span>
                      <a href={`tel:${settings.contactPhone}`} className="text-xs font-semibold text-white hover:underline">{settings.contactPhone}</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
