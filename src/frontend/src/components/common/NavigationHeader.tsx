import React from 'react';
import { Car, Search, User as UserIcon, Shield, Calendar, LogOut } from 'lucide-react';
import { User } from '../../types/auth';

interface NavigationHeaderProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenBookings: () => void;
  onOpenAdmin: () => void;
  onNavigateHome: () => void;
  onBrowseCars: () => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenBookings,
  onOpenAdmin,
  onNavigateHome,
  onBrowseCars,
  onNavigateSection,
}) => {
  const handleSectionClick = (sectionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0B0B0B]/80 border-b border-white/5 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={onNavigateHome}
          className="flex items-center gap-2 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DFB15B] to-[#b38838] flex items-center justify-center shadow-lg shadow-[#DFB15B]/20 group-hover:scale-105 transition-transform">
            <span className="text-black font-extrabold text-2xl tracking-tighter">R</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-widest text-white">
              RIDE<span className="text-[#DFB15B]">LUX</span>
            </span>
            <span className="text-[9px] tracking-[0.25em] text-neutral-400 font-medium">LUXURY FLEET</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-300">
          <button 
            onClick={onNavigateHome}
            className="hover:text-[#DFB15B] transition-colors cursor-pointer"
          >
            Home
          </button>
          <button 
            onClick={onBrowseCars}
            className="hover:text-[#DFB15B] transition-colors cursor-pointer"
          >
            Cars
          </button>
          <button
            onClick={(e) => handleSectionClick('destinations', e)}
            className="hover:text-[#DFB15B] transition-colors cursor-pointer"
          >
            Destinations
          </button>
          <button
            onClick={(e) => handleSectionClick('experiences', e)}
            className="hover:text-[#DFB15B] transition-colors cursor-pointer"
          >
            Experiences
          </button>
          <button
            onClick={(e) => handleSectionClick('about', e)}
            className="hover:text-[#DFB15B] transition-colors cursor-pointer"
          >
            About
          </button>
        </nav>

        {/* Action Area */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onBrowseCars}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:border-white/20 transition-all cursor-pointer"
            title="Search fleet"
          >
            <Search className="w-4 h-4" />
          </button>

          {currentUser ? (
            <div className="flex items-center gap-3">
              {currentUser.role === 'Admin' && (
                <button
                  onClick={onOpenAdmin}
                  className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-500/20 transition-all cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </button>
              )}

              <button
                onClick={onOpenBookings}
                className="px-3.5 py-1.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-neutral-700 transition-all cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-[#DFB15B]" />
                Bookings
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <span className="text-xs text-neutral-300 hidden sm:inline">
                  {currentUser.name}
                </span>
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="w-8 h-8 rounded-full bg-neutral-800/80 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 text-sm text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={onBrowseCars}
                className="px-5 py-2.5 rounded-full bg-[#DFB15B] hover:bg-[#c99f52] text-black text-sm font-semibold tracking-wide shadow-lg shadow-[#DFB15B]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
              >
                Rent a Car <span>→</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
