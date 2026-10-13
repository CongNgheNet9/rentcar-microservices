import React from 'react';
import { Play, Sparkles, ChevronRight, Award } from 'lucide-react';

interface HeroSectionProps {
  onBrowseCars: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onBrowseCars }) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#DFB15B]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-amber-600/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Content */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#DFB15B] tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CAR RENTAL</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Unforgettable Drives{' '}
              <span className="text-[#DFB15B] italic font-serif-luxury block sm:inline">
                Await
              </span>
            </h1>

            <p className="text-base sm:text-lg text-neutral-400 max-w-xl font-normal leading-relaxed">
              Experience the pinnacle of automotive engineering and prestige. Rent iconic supercars, bespoke SUVs, and elite electric cruisers with effortless microservice-backed reservations.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={onBrowseCars}
                className="px-8 py-4 rounded-full bg-[#DFB15B] hover:bg-[#c99f52] text-black font-bold text-sm tracking-wide shadow-xl shadow-[#DFB15B]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 cursor-pointer"
              >
                Browse Cars <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => alert('Watch video preview')}
                className="px-6 py-4 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-all flex items-center gap-2.5 backdrop-blur-sm cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">
                  <Play className="w-3 h-3 fill-white ml-0.5" />
                </div>
                Watch Video
              </button>
            </div>

            {/* Quick credibility bullet */}
            <div className="pt-6 border-t border-white/10 flex items-center gap-6 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#DFB15B]" />
                <span>Verified Clean Title Fleet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Instant Overlap-Protected Booking</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-neutral-900 to-black p-2 shadow-2xl group">
              <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-950">
                <img
                  src="https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80"
                  alt="Lamborghini Huracán in Showroom"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                
                {/* Floating badge */}
                <div className="absolute top-4 left-4 glass-panel px-4 py-2 rounded-xl text-left">
                  <div className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold">Featured Exotic</div>
                  <div className="text-sm font-bold text-white">Lamborghini Huracán Spyder</div>
                </div>

                {/* Floating price tag */}
                <div className="absolute bottom-4 right-4 glass-panel px-4 py-2 rounded-xl text-right">
                  <div className="text-[10px] text-[#DFB15B] uppercase tracking-wider font-semibold">From</div>
                  <div className="text-base font-extrabold text-white">$1,299 <span className="text-xs font-normal text-neutral-400">/ day</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
