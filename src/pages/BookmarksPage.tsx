import { Bookmark, Search } from "lucide-react";

export default function BookmarksPage() {
  return (
    <div className="h-full w-full flex flex-col pt-12 md:pt-4 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto space-y-8">
        
        <section className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
               <Bookmark className="fill-white text-white" size={28} /> Bookmarks
            </h1>
            <p className="text-gray-400 text-sm">Your saved chats, documents, resources, and study materials.</p>
        </section>

        <section className="bg-[#0A0A0A] border border-[#222] rounded-3xl p-12 flex flex-col items-center justify-center text-center">
            <div className="bg-[#111] p-4 rounded-full mb-4">
                <Bookmark size={32} className="text-gray-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Bookmarks Yet</h3>
            <p className="text-gray-400 text-sm max-w-sm">
                Save useful AI responses, library catalogs, or flashcard sets to access them quickly here.
            </p>
        </section>

      </div>
    </div>
  );
}
