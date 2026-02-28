import { Activity, User } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="glass-strong sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Activity className="w-8 h-8 text-sky-400" />
            <div className="absolute inset-0 w-8 h-8 bg-sky-400/20 rounded-full blur-md" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">AutoPilot</h1>
            <p className="text-[10px] text-slate-400 tracking-widest uppercase">
              Relationship Intelligence, Automated
            </p>
          </div>
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400 hidden sm:block">Divyaansh</span>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </nav>
  );
}
