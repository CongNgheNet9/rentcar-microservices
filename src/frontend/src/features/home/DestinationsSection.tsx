import React from 'react';
import { MapPin, Compass, ArrowUpRight, Navigation, Sparkles } from 'lucide-react';

interface DestinationsSectionProps {
  onBrowseCars: () => void;
}

const DESTINATIONS = [
  {
    id: 1,
    title: 'Pacific Coast Highway',
    location: 'California, USA',
    tag: 'Coastal Cliffs & Ocean Curves',
    distance: '650 Miles',
    recommended: 'Porsche 911 GT3 RS',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    description: 'Iconic winding asphalt along Big Sur cliffs, sunset vistas, and unrestricted driving thrill.'
  },
  {
    id: 2,
    title: 'Ocean Drive & Biscayne Bay',
    location: 'Miami, Florida',
    tag: 'Art Deco & Waterfront Boulevard',
    distance: '120 Miles',
    recommended: 'Lamborghini Huracán EVO',
    image: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=1200&q=80',
    description: 'Neon nightlife, ocean breeze, and unmistakable V10 presence through South Beach and Brickell.'
  },
  {
    id: 3,
    title: 'The Hamptons Coastal Route',
    location: 'New York, USA',
    tag: 'Estate Estates & Atlantic Breeze',
    distance: '95 Miles',
    recommended: 'Rolls-Royce Ghost Series II',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    description: 'Whisper-quiet luxury from Manhattan through Montauk Lighthouse, surrounded by private beachfront estates.'
  },
  {
    id: 4,
    title: 'Hai Van Pass & Da Nang Coastal',
    location: 'Da Nang - Hue, Vietnam',
    tag: 'Sea Cloud Mountains & Seaside Vistas',
    distance: '85 km',
    recommended: 'Mercedes-Maybach S 680',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
    description: 'World-renowned coastal mountain pass overlooking the turquoise East Sea and Golden Bridge.'
  }
];

export const DestinationsSection: React.FC<DestinationsSectionProps> = ({ onBrowseCars }) => {
  return (
    <section id="destinations" className="py-24 bg-[#0B0B0B] border-t border-white/5 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#DFB15B] text-xs font-bold uppercase tracking-[0.25em] mb-2">
              <Compass className="w-4 h-4" />
              <span>ICONIC DRIVING ROUTES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Curated Luxury <span className="text-[#DFB15B]">Destinations</span>
            </h2>
            <p className="text-neutral-400 text-sm mt-2 max-w-xl">
              Hand-picked scenic routes perfectly matched with our precision performance supercars and prestige touring sedans.
            </p>
          </div>

          <button
            onClick={onBrowseCars}
            className="self-start md:self-auto px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer group"
          >
            <span>Explore All Fleet</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DESTINATIONS.map((dest) => (
            <div
              key={dest.id}
              className="group relative rounded-3xl overflow-hidden border border-white/10 bg-neutral-900/50 hover:border-[#DFB15B]/50 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Image & overlay */}
              <div className="relative h-64 sm:h-72 w-full overflow-hidden">
                <img
                  src={dest.image}
                  alt={dest.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-75 group-hover:brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-transparent to-black/30" />

                {/* Top Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-[#DFB15B]" />
                    {dest.location}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#DFB15B]/20 backdrop-blur-md border border-[#DFB15B]/30 text-[#DFB15B] text-[10px] font-bold">
                    {dest.distance}
                  </span>
                </div>
              </div>

              {/* Information */}
              <div className="p-6 relative -mt-8 bg-gradient-to-b from-[#0B0B0B]/80 to-[#0B0B0B] backdrop-blur-md rounded-t-3xl border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white group-hover:text-[#DFB15B] transition-colors">
                    {dest.title}
                  </h3>
                  <button
                    onClick={onBrowseCars}
                    className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-[#DFB15B] text-neutral-400 group-hover:text-black flex items-center justify-center transition-all cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed">
                  {dest.description}
                </p>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-neutral-300">
                    <Sparkles className="w-3.5 h-3.5 text-[#DFB15B]" />
                    <span className="text-[11px] font-medium">Recommended:</span>
                    <strong className="text-white text-[11px]">{dest.recommended}</strong>
                  </div>

                  <button
                    onClick={onBrowseCars}
                    className="text-[11px] text-[#DFB15B] font-bold hover:underline cursor-pointer"
                  >
                    Rent for Route →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
