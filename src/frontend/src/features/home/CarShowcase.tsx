import React, { useState } from 'react';
import { Heart, ArrowRight, MapPin, Fuel, Gauge, Sparkles } from 'lucide-react';
import { Vehicle, VehicleType } from '../../types/vehicle';

interface CarShowcaseProps {
  vehicles: Vehicle[];
  vehicleTypes: VehicleType[];
  selectedTypeId: number | null;
  onSelectType: (typeId: number | null) => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
}

export const CarShowcase: React.FC<CarShowcaseProps> = ({
  vehicles,
  vehicleTypes,
  selectedTypeId,
  onSelectType,
  onSelectVehicle
}) => {
  const [favorites, setFavorites] = useState<Record<number, boolean>>({});

  const toggleFavorite = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="cars-section" className="py-20 bg-[#0B0B0B] text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-[11px] font-semibold tracking-widest uppercase text-[#DFB15B] mb-3">
              <Sparkles className="w-3 h-3" />
              <span>OUR CARS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Choose Your <span className="text-[#DFB15B] font-serif-luxury italic">Dream Car</span>
            </h2>
            <p className="text-neutral-400 text-sm mt-2 max-w-lg">
              Explore our hand-picked inventory with guaranteed real-time availability and transparent pricing.
            </p>
          </div>

          <div className="text-xs text-neutral-400">
            Showing <span className="text-white font-semibold">{vehicles.length}</span> luxury models ready for reservation
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2.5 mb-10 pb-2">
          <button
            onClick={() => onSelectType(null)}
            className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              selectedTypeId === null
                ? 'bg-[#DFB15B] text-black shadow-lg shadow-[#DFB15B]/20 scale-105'
                : 'bg-neutral-900 border border-white/10 text-neutral-300 hover:border-white/20 hover:text-white'
            }`}
          >
            All Cars
          </button>

          {vehicleTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => onSelectType(type.id)}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                selectedTypeId === type.id
                  ? 'bg-[#DFB15B] text-black shadow-lg shadow-[#DFB15B]/20 scale-105'
                  : 'bg-neutral-900 border border-white/10 text-neutral-300 hover:border-white/20 hover:text-white'
              }`}
            >
              {type.name}
            </button>
          ))}
        </div>

        {/* Car Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vehicles.map((car) => {
            const isFav = favorites[car.id];

            return (
              <div
                key={car.id}
                onClick={() => onSelectVehicle(car)}
                className="group relative rounded-3xl bg-[#141414] border border-white/5 hover:border-[#DFB15B]/30 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-[#DFB15B]/5 transition-all duration-300 flex flex-col cursor-pointer"
              >
                {/* Image and overlay header */}
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
                  <img
                    src={car.imageUrl || 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80'}
                    alt={`${car.brand} ${car.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Top badges */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-black/60 backdrop-blur-md text-[#DFB15B] border border-white/10">
                      {car.vehicleTypeName}
                    </span>
                    <button
                      onClick={(e) => toggleFavorite(e, car.id)}
                      className={`pointer-events-auto w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer ${
                        isFav
                          ? 'bg-rose-500 text-white'
                          : 'bg-black/50 text-white/70 hover:text-white hover:bg-black/70'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
                      <span className="font-semibold tracking-wider text-neutral-300 uppercase">{car.brand}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#DFB15B]" />
                        {car.locationName}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white group-hover:text-[#DFB15B] transition-colors leading-tight">
                      {car.model}
                    </h3>
                  </div>

                  {/* Spec highlights */}
                  <div className="py-4 my-2 border-y border-white/5 flex items-center justify-between text-xs text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-neutral-500" />
                      {car.year} Model
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5 text-neutral-500" />
                      Auto / Sport
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">
                      {car.status}
                    </span>
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-xs text-neutral-500 block">Daily rate</span>
                      <div className="text-xl font-extrabold text-white">
                        ${car.pricePerDay}
                        <span className="text-xs font-normal text-neutral-400"> / day</span>
                      </div>
                    </div>

                    <div className="w-10 h-10 rounded-full bg-[#DFB15B]/10 group-hover:bg-[#DFB15B] text-[#DFB15B] group-hover:text-black flex items-center justify-center transition-all">
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
