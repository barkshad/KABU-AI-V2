import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-white p-3 rounded-2xl mb-6">
         <BookOpen size={32} className="text-black" />
      </div>
      <h1 className="text-6xl font-bold tracking-tight mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-300 mb-6">Page Not Found</h2>
      <p className="text-gray-500 mb-8 max-w-sm">The route you are looking for does not exist in the Academic Workspace or has been moved.</p>
      <Link to="/" className="bg-white text-black font-semibold py-3 px-8 rounded-xl hover:bg-gray-200 transition-colors">
        Return to Workspace
      </Link>
    </div>
  );
}
