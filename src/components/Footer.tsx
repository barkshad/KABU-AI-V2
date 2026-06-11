import { Link } from "react-router-dom";

export default function Footer({ role }: { role?: string }) {
  return (
    <footer className="w-full bg-[#050505] border-t border-[#222] py-8 text-sm">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
         <div className="space-y-4">
           <div className="font-bold text-white tracking-tight flex items-center gap-2">Kabu AI</div>
           <p className="text-gray-500 text-xs">University-grade Academic Intelligence Platform built exclusively for Kabarak University.</p>
           <div className="text-gray-600 text-xs mt-4">© {new Date().getFullYear()} Kabarak University.</div>
         </div>
         <div className="flex flex-col gap-3">
           <span className="text-white font-semibold mb-2">Company</span>
           <Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link>
           <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link>
         </div>
         <div className="flex flex-col gap-3">
           <span className="text-white font-semibold mb-2">Support</span>
           <Link to="/help" className="text-gray-400 hover:text-white transition-colors">Help Center</Link>
           <Link to="/faq" className="text-gray-400 hover:text-white transition-colors">FAQ</Link>
         </div>
         <div className="flex flex-col gap-3">
           <span className="text-white font-semibold mb-2">Legal</span>
           <Link to="/terms-and-conditions" className="text-gray-400 hover:text-white transition-colors">Terms Conditions</Link>
           <Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
           <Link to="/data-protection" className="text-gray-400 hover:text-white transition-colors">Data Protection</Link>
           {role === 'admin' && (
             <Link to="/admin" className="text-blue-400 hover:text-blue-300 font-medium transition-colors mt-2">Admin Control Center</Link>
           )}
         </div>
      </div>
    </footer>
  );
}
