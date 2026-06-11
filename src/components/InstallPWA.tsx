import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };
    
    window.addEventListener("beforeinstallprompt", handler);
    
    if (window.matchMedia('(display-mode: standalone)').matches) {
       setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const onClick = (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault();
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
  };

  if (!supportsPWA || isInstalled || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-white border border-[#333] shadow-2xl rounded-2xl p-4 flex items-center gap-4 max-w-sm w-[90%] md:w-auto">
       <div className="bg-black text-white p-2.5 rounded-xl shrink-0">
          <Download size={20} />
       </div>
       <div className="flex-1">
          <h4 className="text-black font-bold text-sm">Install Kabu AI</h4>
          <p className="text-gray-600 text-xs mt-0.5">For faster access and full screen mode</p>
       </div>
       <div className="flex items-center gap-2">
          <button 
             onClick={onClick}
             className="bg-black text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
             Install
          </button>
          <button 
             onClick={() => setDismissed(true)}
             className="text-gray-400 hover:text-black transition-colors p-1"
          >
             <X size={18} />
          </button>
       </div>
    </div>
  );
}
