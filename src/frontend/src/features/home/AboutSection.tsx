import React from 'react';
import { ShieldCheck, Cpu, Clock, Award, CheckCircle2, Lock, Sparkles, Server } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-24 bg-[#0B0B0B] border-t border-white/5 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DFB15B]/10 border border-[#DFB15B]/20 text-[#DFB15B] text-xs font-bold uppercase tracking-[0.2em] mb-4">
            <Award className="w-3.5 h-3.5" />
            <span>THE RIDELUX STANDARD</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Engineered for <span className="text-[#DFB15B]">Excellence</span>
          </h2>
          <p className="text-neutral-400 text-sm mt-3 leading-relaxed">
            RideLux pairs an ultra-exclusive luxury fleet with an enterprise-grade distributed microservices architecture to guarantee absolute reliability, instantaneous booking, and frictionless payment.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {/* Pillar 1: Microservices */}
          <div className="p-6 rounded-3xl bg-neutral-900/40 border border-white/10 hover:border-[#DFB15B]/30 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 text-[#DFB15B] flex items-center justify-center mb-5">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Microservices Core</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Decoupled UserService, VehicleService, and BookingService behind high-throughput YARP Gateway with database-per-service isolation.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-white/5 text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Independent Fault Domains</span>
            </div>
          </div>

          {/* Pillar 2: Zero Overlap */}
          <div className="p-6 rounded-3xl bg-neutral-900/40 border border-white/10 hover:border-[#DFB15B]/30 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 text-[#DFB15B] flex items-center justify-center mb-5">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Zero-Overlap Guarantee</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Mathematical half-open interval checks [Pickup, Return) guarded by vehicle-scoped locks and SHA-256 Idempotency-Keys prevent double booking.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-white/5 text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>100% Conflict Proof</span>
            </div>
          </div>

          {/* Pillar 3: Insurance */}
          <div className="p-6 rounded-3xl bg-neutral-900/40 border border-white/10 hover:border-[#DFB15B]/30 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 text-[#DFB15B] flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">$1M Platinum Coverage</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Full comprehensive collision waiver and primary liability protection backed by Lloyd's of London included in every reservation automatically.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-white/5 text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Zero Deductible Waiver</span>
            </div>
          </div>

          {/* Pillar 4: Real-time Telemetry */}
          <div className="p-6 rounded-3xl bg-neutral-900/40 border border-white/10 hover:border-[#DFB15B]/30 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 text-[#DFB15B] flex items-center justify-center mb-5">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">24/7 Global Telemetry</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Continuous satellite telemetry diagnostics, live mechanical health monitoring, and on-demand roadside response dispatch team.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-white/5 text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>15-Min Response SLA</span>
            </div>
          </div>
        </div>

        {/* Technical Architecture Overview Card */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-900/80 to-neutral-900 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#DFB15B]/5 rounded-full blur-3xl" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2 text-xs font-bold text-[#DFB15B] uppercase tracking-wider">
                <Server className="w-4 h-4" />
                <span>Distributed Microservice Topology</span>
              </div>
              <h3 className="text-2xl font-black text-white">
                Built Strictly According to Microservices Specifications
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Every service maintains its own isolated database instance (SQLite / SQL Server). Inter-service communication uses authenticated HTTP client contracts and asynchronous telemetry events. Idempotent requests ensure that network glitches never cause duplicate charges or overlapping reservations.
              </p>
            </div>

            {/* Microservice Topology Diagram */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto text-xs">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-center">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Gateway</span>
                <span className="font-mono font-bold text-[#DFB15B]">Port 5000</span>
                <span className="text-[9px] text-neutral-500 block mt-0.5">YARP Reverse Proxy</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-center">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">UserService</span>
                <span className="font-mono font-bold text-blue-400">Port 5001</span>
                <span className="text-[9px] text-neutral-500 block mt-0.5">JWT & BCrypt</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-center">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">VehicleService</span>
                <span className="font-mono font-bold text-amber-400">Port 5002</span>
                <span className="text-[9px] text-neutral-500 block mt-0.5">Fleet Catalog</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-center">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">BookingService</span>
                <span className="font-mono font-bold text-emerald-400">Port 5003</span>
                <span className="text-[9px] text-neutral-500 block mt-0.5">Lock & Overlap Engine</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-center">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Payment Ledger</span>
                <span className="font-mono font-bold text-purple-400">Port 5003</span>
                <span className="text-[9px] text-neutral-500 block mt-0.5">Multi-Gateway Settlement</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-center">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Frontend App</span>
                <span className="font-mono font-bold text-teal-400">Port 5173</span>
                <span className="text-[9px] text-neutral-500 block mt-0.5">React 18 + Vite + TS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
