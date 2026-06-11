import { User as UserIcon, Lock, Moon, Bell } from "lucide-react";

export default function SettingsPage({ user }: { user: any }) {
  return (
    <div className="h-full w-full flex flex-col pt-12 md:pt-4 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        
        <section className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
            <p className="text-gray-400 text-sm">Manage your workspace preferences and security.</p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
           <div className="col-span-1 flex flex-col gap-2">
              <button className="text-left px-4 py-2.5 rounded-lg bg-[#111] text-white font-medium text-sm">Account Settings</button>
              <button className="text-left px-4 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#111]/50 font-medium text-sm transition-colors">Security</button>
              <button className="text-left px-4 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#111]/50 font-medium text-sm transition-colors">Preferences</button>
           </div>
           
           <div className="col-span-3 space-y-6">
              <div className="bg-[#050505] border border-[#222] rounded-2xl p-6">
                 <h3 className="text-lg font-bold text-white mb-6 border-b border-[#222] pb-4">Account Profile</h3>
                 <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 bg-[#111] rounded-full border border-[#333] flex items-center justify-center text-2xl text-white font-bold">
                       {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || "S"}
                    </div>
                    <div>
                       <h4 className="text-white font-semibold">{user.displayName || "Student"}</h4>
                       <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div>
                       <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Display Name</label>
                       <input type="text" disabled value={user.displayName || ""} className="w-full bg-[#0A0A0A] border border-[#222] rounded-xl px-4 py-3 text-white text-sm opacity-60 cursor-not-allowed" />
                    </div>
                 </div>
              </div>

              <div className="bg-[#050505] border border-[#222] rounded-2xl p-6">
                 <h3 className="text-lg font-bold text-white mb-6 border-b border-[#222] pb-4">Zone & Style</h3>
                 <div className="flex items-center justify-between p-4 bg-[#0A0A0A] border border-[#222] rounded-xl">
                    <div className="flex items-center gap-3">
                       <Moon size={18} className="text-gray-400" />
                       <span className="text-white text-sm font-medium">Dark Mode (Default)</span>
                    </div>
                    <div className="w-10 h-6 bg-blue-600 rounded-full relative">
                       <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

      </div>
    </div>
  );
}
