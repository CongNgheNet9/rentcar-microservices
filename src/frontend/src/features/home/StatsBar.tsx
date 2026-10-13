import React from 'react';
import { Star, Users, MapPin, ShieldCheck } from 'lucide-react';

export const StatsBar: React.FC = () => {
  return (
    <section className="border-y border-white/5 bg-neutral-950/60 backdrop-blur-md py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {/* Stat 1 */}
          <div className="flex flex-col items-center md:items-start md:pl-4 first:pl-0">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-[#DFB15B]" />
              <span className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">200+</span>
            </div>
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Luxury Vehicles</span>
          </div>

          {/* Stat 2 */}
          <div className="flex flex-col items-center md:items-start md:pl-8 pt-4 md:pt-0">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-5 h-5 text-[#DFB15B]" />
              <span className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">50+</span>
            </div>
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Global Locations</span>
          </div>

          {/* Stat 3 */}
          <div className="flex flex-col items-center md:items-start md:pl-8 pt-4 md:pt-0">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-[#DFB15B]" />
              <span className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">10K+</span>
            </div>
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Happy Customers</span>
          </div>

          {/* Stat 4 */}
          <div className="flex flex-col items-center md:items-start md:pl-8 pt-4 md:pt-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center text-[#DFB15B]">
                <Star className="w-5 h-5 fill-[#DFB15B]" />
              </div>
              <span className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">4.9</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Average Rating</span>
              <div className="flex -space-x-1.5 overflow-hidden">
                <img className="inline-block h-4 w-4 rounded-full ring-1 ring-black" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&q=80" alt="avatar" />
                <img className="inline-block h-4 w-4 rounded-full ring-1 ring-black" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&q=80" alt="avatar" />
                <img className="inline-block h-4 w-4 rounded-full ring-1 ring-black" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&q=80" alt="avatar" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
