import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { MessageSquare, LayoutDashboard, Bookmark, Settings, LogOut, Menu, Plus, ShieldAlert, FileText, Mic, Library, WifiOff, RefreshCcw } from "lucide-react";
import { authService } from "../services/auth";
import Footer from "./Footer";

export default function Layout({ user, role }: { user: any; role: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setIsSyncing(true);
      // Let it show syncing for a bit before clearing
      setTimeout(() => setIsSyncing(false), 3000);
    };
    
    const handleOffline = () => setIsOffline(true);

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SYNC_COMPLETE') {
         setIsSyncing(false);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Workspace", path: "/workspace" },
    { icon: MessageSquare, label: "AI Chat", path: "/chat" },
    { icon: FileText, label: "Analyze Doc", path: "/analyze" },
    { icon: Mic, label: "Transcribe", path: "/transcribe" },
    { icon: Library, label: "Resources", path: "/resources" },
    { icon: Bookmark, label: "Bookmarks", path: "/bookmarks" },
  ];

  if (role === "admin") {
    navItems.push({ icon: ShieldAlert, label: "Admin Panel", path: "/admin" });
  }

  return (
    <div className="flex h-screen bg-[#000000] text-gray-200 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#080808] border-r border-[#222222] transform transition-transform duration-300 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="font-bold text-xl text-white tracking-tight flex items-center gap-2">
            <span className="bg-white text-black p-1 rounded-md">
              <Library size={18} className="fill-black" />
            </span>
            Kabu AI
          </div>
          <button className="md:hidden text-gray-400" onClick={() => setSidebarOpen(false)}>
            <Menu />
          </button>
        </div>

        <div className="px-3 pb-2 mt-2">
          <button 
            onClick={() => { navigate("/chat"); setSidebarOpen(false); }}
            className="w-full flex items-center gap-2 bg-[#111111] hover:bg-[#1A1A1A] border border-[#222222] text-white px-3 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={18} />
            <span className="font-medium text-sm">New Chat</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-[#1A1A1A] text-white border border-[#333]" 
                    : "text-gray-400 hover:text-white hover:bg-[#111] border border-transparent"
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[#222222]">
          <div className="flex items-center gap-3 mb-4 cursor-pointer hover:bg-[#111] p-2 rounded-xl transition-colors" onClick={() => navigate("/settings")}>
            <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center font-bold text-xs text-white">
              {user.displayName?.[0] || user.email?.[0].toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-white truncate">{user.displayName || "Student"}</span>
              <span className="text-xs text-gray-500 truncate capitalize">{role}</span>
            </div>
            <Settings size={16} className="text-gray-500 ml-auto" />
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors px-2 py-1.5"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-[#000000] relative">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-[#222222] bg-[#050505]">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400">
            <Menu size={24} />
          </button>
          <span className="font-bold text-white tracking-tight">Kabu AI</span>
          <button onClick={() => navigate("/chat")} className="text-gray-400">
             <Plus size={24} />
          </button>
        </header>

        {isOffline && (
          <div className="bg-yellow-900/30 border-b border-yellow-900/50 text-yellow-500 text-xs py-2 px-4 flex items-center justify-center gap-2 font-medium">
            <WifiOff size={14} /> You are offline. Limited functionality available. Changes will sync when online.
          </div>
        )}
        
        {isSyncing && !isOffline && (
          <div className="bg-blue-900/30 border-b border-blue-900/50 text-blue-400 text-xs py-2 px-4 flex items-center justify-center gap-2 font-medium">
            <RefreshCcw size={14} className="animate-spin" /> Syncing data with cloud...
          </div>
        )}
        
        <div className="flex-1 overflow-x-hidden overflow-y-auto relative flex flex-col">
          <div className="flex-1 flex flex-col">
             <Outlet />
          </div>
          <Footer role={role} />
        </div>
      </main>
    </div>
  );
}
