import React from 'react';

export const BrandPartners: React.FC = () => {
  const brands = [
    'LAMBORGHINI',
    'FERRARI',
    'PORSCHE',
    'MCLAREN',
    'ROLLS-ROYCE',
    'BENTLEY',
    'ASTON MARTIN',
    'MERCEDES-BENZ'
  ];

  return (
    <section className="py-12 bg-[#0B0B0B] border-b border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 font-semibold mb-8">
          CURATED FROM WORLD-CLASS MARQUES
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 lg:gap-16 opacity-60 hover:opacity-100 transition-opacity">
          {brands.map((brand) => (
            <div
              key={brand}
              className="text-neutral-400 hover:text-[#DFB15B] font-bold text-sm sm:text-base tracking-widest font-serif-luxury transition-colors select-none cursor-default"
            >
              {brand}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
