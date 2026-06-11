import { BookOpen, Clock, FileText, Search, Plus } from "lucide-react";
import { Link } from "react-router-dom";

export default function WorkspacePage() {
  return (
    <div className="h-full w-full flex flex-col pt-12 md:pt-4 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto space-y-10">
        
        {/* Header */}
        <section className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">My Academic Workspace</h1>
            <p className="text-gray-400 text-sm">Welcome back. Your continuous research environment.</p>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { title: "New Chat", path: "/chat", icon: Plus, color: "bg-blue-600", text: "text-white" },
             { title: "Transcribe Lecture", path: "/transcribe", icon: Clock, color: "bg-[#111]", text: "text-gray-200" },
             { title: "Analyze Document", path: "/analyze", icon: FileText, color: "bg-[#111]", text: "text-gray-200" },
             { title: "Library Search", path: "/resources", icon: Search, color: "bg-[#111]", text: "text-gray-200" }
           ].map((a, i) => (
             <Link key={i} to={a.path} className={`flex flex-col p-5 rounded-2xl border border-[#222] hover:border-gray-500 transition-colors ${a.color} ${a.text}`}>
                <a.icon size={22} className="mb-4" />
                <span className="font-semibold">{a.title}</span>
             </Link>
           ))}
        </section>

        {/* Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-8">
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Recent Chats</h2>
                <div className="bg-[#0A0A0A] border border-[#222] rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <p className="text-gray-500 text-sm">No recent conversations found. Start a new chat to begin your research.</p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Saved Documents</h2>
                <div className="bg-[#0A0A0A] border border-[#222] rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <p className="text-gray-500 text-sm">Upload documents to analyze and keep them in your workspace.</p>
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Study Statistics</h2>
                 <div className="bg-[#0A0A0A] border border-[#222] rounded-2xl p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Total Chats</span>
                      <span className="text-white font-mono">0</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Saved Notes</span>
                      <span className="text-white font-mono">0</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Transcriptions</span>
                      <span className="text-white font-mono">0</span>
                    </div>
                 </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Recent Flashcards</h2>
                <div className="bg-[#0A0A0A] border border-[#222] rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <p className="text-gray-500 text-sm">Generate flashcards from your notes to see them here.</p>
                </div>
              </section>
            </div>
            
        </div>

      </div>
    </div>
  );
}
