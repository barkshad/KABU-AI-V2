import { useState } from "react";
import { FileText, Search, Filter } from "lucide-react";

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const categories = ["All", "Law", "Medicine", "Business", "Computer Science", "Engineering", "Theology"];
  
  const mockDocuments = [
    { title: "Constitution of Kenya, 2010", author: "Kenya Government", year: 2010, cat: "Law", type: "PDF" },
    { title: "Data Protection Act, 2019", author: "Kenya Government", year: 2019, cat: "Law", type: "PDF" },
    { title: "Principles of Constitutional Law", author: "P. Kanyi", year: 2021, cat: "Law", type: "Journal" },
    { title: "Social Media and Justice Systems", author: "Journal of Law", year: 2022, cat: "Law", type: "Article" },
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto px-4 py-8 md:px-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-[#111111] border border-[#222222] rounded-lg">
          <FileText size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Library Resources</h1>
          <p className="text-sm text-gray-400">Approved academic materials for Kabu AI.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search documents, authors, keywords..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111111] border border-[#222222] rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-gray-500 transition-colors"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                category === cat 
                  ? "bg-white text-black border-transparent" 
                  : "bg-[#111111] text-gray-400 border-[#222222] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockDocuments.map((doc, i) => (
          <div key={i} className="group bg-[#111111] border border-[#222222] hover:border-gray-600 rounded-2xl p-5 transition-all cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 bg-[#1A1A1A] rounded-xl group-hover:bg-[#222222] transition-colors">
                <FileText size={20} className="text-gray-300" />
              </div>
              <span className="text-xs font-medium px-2.5 py-1 bg-[#1A1A1A] text-gray-400 rounded-md uppercase tracking-wider">{doc.type}</span>
            </div>
            
            <h3 className="text-base font-medium text-white mb-1 line-clamp-2 leading-snug">{doc.title}</h3>
            <p className="text-sm text-gray-400 mb-4">{doc.author} • {doc.year}</p>
            
            <div className="inline-flex items-center text-xs font-semibold text-gray-500 uppercase tracking-widest px-2.5 py-1 border border-[#333] rounded-md">
              {doc.cat}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
