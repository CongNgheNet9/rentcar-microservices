import React, { useState } from 'react';
import { Crown, Zap, HeartHandshake, Sunset, CheckCircle2, PhoneCall, ShieldCheck, ArrowRight } from 'lucide-react';

interface ExperiencesSectionProps {
  onBrowseCars: () => void;
}

const EXPERIENCES = [
  {
    id: 'chauffeur',
    title: 'VIP Chauffeur & Jet Concierge',
    subtitle: 'Private Tarmac Meet & Greet',
    icon: Crown,
    badge: 'MOST REQUESTED',
    description: 'White-glove curbside handover at private FBO aviation terminals. Highly trained, bilingual personal chauffeurs with executive security protocol.',
    highlights: [
      'Private airport tarmac curbside delivery',
      'Certified bilingual executive chauffeurs',
      'Luggage handling & chilled vintage refreshments',
      'Encrypted itinerary and client confidentiality'
    ],
    startingPrice: '$1,200 / day'
  },
  {
    id: 'track',
    title: 'Supercar Track Day Tour',
    subtitle: 'Unrestricted Apex & Acceleration',
    icon: Zap,
    badge: 'ADRENALINE ELITE',
    description: 'Push our Porsche 911 GT3 and Ferrari F8 to the redline on closed private circuit circuits. Complete with telemetry logging and personal race engineers.',
    highlights: [
      'FIA-standard private track circuit reservation',
      'Personal racing instructor & line analysis',
      'Telemetry data logging & onboard 4K cameras',
      'High-performance tire & brake support crew'
    ],
    startingPrice: '$2,800 / day'
  },
  {
    id: 'wedding',
    title: 'Gala & Wedding Fleet Convoy',
    subtitle: 'Grand Ceremonial Arrivals',
    icon: HeartHandshake,
    badge: 'LUXURY CEREMONY',
    description: 'Immaculately coordinated convoy of Rolls-Royce Ghost, Phantom, and Maybach sedans dressed in celebratory elegance for weddings and royal galas.',
    highlights: [
      'Synchronized multi-vehicle fleet coordination',
      'Floral and ceremonial ribbon appointments',
      'Backup redundancy vehicle on immediate standby',
      'Red-carpet arrival staging at premier venues'
    ],
    startingPrice: '$3,500 / event'
  },
  {
    id: 'coastal',
    title: 'Curated Coastal Weekend',
    subtitle: 'Turn-Key Supercar Itinerary',
    icon: Sunset,
    badge: 'SIGNATURE ESCAPE',
    description: 'A completely arranged weekend getaway. Premium supercar delivery to your doorstep, pre-reserved Michelin-starred dining, and ocean-view villa valet.',
    highlights: [
      'Custom programmed GPS navigation route',
      'Reserved valet bays at luxury resort partners',
      'Pre-booked private dining & wine pairings',
      '24/7 dedicated luggage escort vehicle'
    ],
    startingPrice: '$4,200 / weekend'
  }
];

export const ExperiencesSection: React.FC<ExperiencesSectionProps> = ({ onBrowseCars }) => {
  const [selectedExp, setSelectedExp] = useState<string | null>(null);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  const handleInquire = (title: string) => {
    setSelectedExp(title);
    setInquirySuccess(true);
  };

  return (
    <section id="experiences" className="py-24 bg-[#0E0E0E] border-t border-white/5 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DFB15B]/10 border border-[#DFB15B]/20 text-[#DFB15B] text-xs font-bold uppercase tracking-[0.2em] mb-4">
            <Crown className="w-3.5 h-3.5" />
            <span>BESPOKE CLIENT SERVICES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Curated Luxury <span className="text-[#DFB15B]">Experiences</span>
          </h2>
          <p className="text-neutral-400 text-sm mt-3 leading-relaxed">
            Beyond exceptional supercars, RideLux provides turn-key VIP concierge arrangements designed for discerning clients and momentous occasions.
          </p>
        </div>

        {/* Experience Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {EXPERIENCES.map((exp) => {
            const Icon = exp.icon;
            return (
              <div
                key={exp.id}
                className="rounded-3xl bg-neutral-900/60 border border-white/10 hover:border-[#DFB15B]/40 p-8 flex flex-col justify-between transition-all duration-300 relative group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-36 h-36 bg-[#DFB15B]/5 rounded-full blur-3xl group-hover:bg-[#DFB15B]/10 transition-colors" />

                <div>
                  {/* Top line with Icon & Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 group-hover:border-[#DFB15B]/30 flex items-center justify-center text-[#DFB15B] group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-wider text-neutral-300 uppercase">
                      {exp.badge}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-[#DFB15B] tracking-wider uppercase block mb-1">
                    {exp.subtitle}
                  </span>
                  <h3 className="text-xl font-black text-white mb-3">
                    {exp.title}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed mb-6">
                    {exp.description}
                  </p>

                  {/* Highlights list */}
                  <div className="space-y-2.5 pt-4 border-t border-white/5">
                    {exp.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-xs text-neutral-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer price & action */}
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase block font-semibold">Starting At</span>
                    <span className="text-base font-black text-white">{exp.startingPrice}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleInquire(exp.title)}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-[#DFB15B] text-neutral-300 hover:text-black text-xs font-bold transition-all cursor-pointer"
                    >
                      Inquire Concierge
                    </button>
                    <button
                      onClick={onBrowseCars}
                      className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                      title="Select vehicle"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Concierge Inquiry Modal */}
      {inquirySuccess && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#DFB15B]/30 rounded-3xl max-w-md w-full p-8 text-center text-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-[#DFB15B]/15 text-[#DFB15B] mx-auto flex items-center justify-center mb-4">
              <PhoneCall className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-white">Concierge Request Logged</h3>
            <p className="text-xs text-neutral-400 mt-2 mb-6 leading-relaxed">
              Your inquiry for <strong className="text-white">{selectedExp}</strong> has been prioritized. A dedicated RideLux Executive Host will contact your registered phone and email within 15 minutes.
            </p>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-left space-y-2 mb-6">
              <div className="flex items-center gap-2 text-neutral-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Private & Confidential Service Guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Dedicated Single Point of Contact Host</span>
              </div>
            </div>

            <button
              onClick={() => setInquirySuccess(false)}
              className="w-full py-3 rounded-2xl bg-[#DFB15B] hover:bg-[#c99f52] text-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              Acknowledged
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
