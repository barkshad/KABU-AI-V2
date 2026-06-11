import { Search, ExternalLink, Bookmark, Filter } from "lucide-react";
import { toast } from "sonner";

export default function ResourcesPage() {
  return (
    <div className="h-full w-full flex flex-col pt-12 md:pt-4 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto space-y-8">
        
        <section className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">University Library</h1>
            <p className="text-gray-400 text-sm">Discover approved academic resources, journals, and databases for Kabarak University.</p>
        </section>

        <section className="flex flex-col sm:flex-row gap-3">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search catalogs, databases, or subjects..."
                className="w-full bg-[#0A0A0A] border border-[#222] text-white pl-11 pr-4 py-3 rounded-xl focus:border-gray-500 focus:outline-none transition-colors text-sm"
              />
           </div>
           <button onClick={() => toast.info("Filter modal not yet implemented in preview.")} className="bg-[#0A0A0A] border border-[#222] text-white px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-[#111] transition-colors text-sm font-medium">
              <Filter size={16} /> Filter
           </button>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {[
             { title: "Kabarak Digital Repository", type: "Internal", desc: "Theses, dissertations, and faculty research outputs." },
             { title: "EBSCOhost", type: "Database", desc: "Premium multidisciplinary academic journals." },
             { title: "JSTOR", type: "Database", desc: "Archive of academic journals spanning humanities and sciences." },
             { title: "Kenya Law Reports", type: "Legal", desc: "Core resource for the School of Law. Case law and statutes." },
             { title: "ProQuest Central", type: "Database", desc: "Extensive collection of scholarly journals." },
             { title: "IEEE Xplore", type: "Engineering", desc: "Technical literature in engineering and technology." }
           ].map((r, i) => (
             <div key={i} className="bg-[#050505] border border-[#222] rounded-2xl p-5 flex flex-col items-start hover:border-gray-600 transition-colors group relative">
                <div className="flex w-full justify-between items-start mb-3">
                   <span className="text-xs font-mono px-2 py-1 bg-[#111] text-gray-400 rounded-md uppercase tracking-wider">{r.type}</span>
                   <button onClick={() => toast.success(`Bookmarked ${r.title}`)} className="text-gray-500 hover:text-white transition-colors">
                      <Bookmark size={18} />
                   </button>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{r.title}</h3>
                <p className="text-sm text-gray-400 flex-1 leading-relaxed">{r.desc}</p>
                <div className="mt-6 w-full flex justify-end">
                   <button onClick={() => window.open('#', '_blank')} className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-1 group-hover:gap-2 transition-all">
                      Access <ExternalLink size={14} />
                   </button>
                </div>
             </div>
           ))}
        </section>

      </div>
    </div>
  );
}
