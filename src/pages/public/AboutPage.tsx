import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link to="/" className="flex items-center gap-3 mb-12">
          <div className="bg-white p-2 rounded-xl">
             <BookOpen size={24} className="text-black" />
          </div>
          <span className="font-bold text-2xl tracking-tight leading-none">Kabu AI</span>
        </Link>
        <h1 className="text-4xl font-bold tracking-tight">About KABU AI</h1>
        <div className="space-y-6 text-gray-400">
           <p>KABU AI is a university-grade Academic Intelligence Platform built exclusively for Kabarak University.</p>
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
      </div>
    </div>
  );
}
