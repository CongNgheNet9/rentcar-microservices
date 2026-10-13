import React from 'react';
import { X, CheckCircle2, Printer, ShieldCheck, Car, Calendar, CreditCard, QrCode } from 'lucide-react';
import { PaymentReceipt } from '../../types/booking';
import { Vehicle } from '../../types/vehicle';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: PaymentReceipt | null;
  vehicle?: Vehicle;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt,
  vehicle
}) => {
  if (!isOpen || !receipt) return null;

  const pickupDate = new Date(receipt.pickupUtc);
  const returnDate = new Date(receipt.returnUtc);
  const paidDate = new Date(receipt.paidAtUtc);
  const durationDays = Math.max(1, Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24)));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#121212] border border-[#DFB15B]/30 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative text-left text-white animate-in fade-in zoom-in-95 duration-200 print:bg-white print:text-black print:border-none print:shadow-none">
        {/* Close button (hidden during print) */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer print:hidden"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Branding & Official Badge */}
        <div className="flex items-start justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DFB15B] to-[#b38838] flex items-center justify-center shadow-lg shadow-[#DFB15B]/20">
              <span className="text-black font-extrabold text-2xl tracking-tighter">R</span>
            </div>
            <div>
              <span className="text-lg font-black tracking-widest text-white block">
                RIDE<span className="text-[#DFB15B]">LUX</span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.25em] text-neutral-400 font-semibold">
                OFFICIAL ELECTRONIC RECEIPT
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black tracking-wider uppercase">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              PAID & VERIFIED
            </span>
            <span className="text-[10px] text-neutral-400 font-mono mt-1">
              {paidDate.toLocaleDateString()} · {paidDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Transaction Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-5 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Transaction Ref</span>
            <span className="font-mono font-bold text-[#DFB15B] truncate block text-[11px]">
              {receipt.transactionReference}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Payment Method</span>
            <span className="font-semibold text-white flex items-center gap-1.5 text-[11px]">
              {receipt.paymentMethod === 'CreditCard' ? (
                <>
                  <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                  {receipt.cardBrand || 'Card'} · {receipt.cardLast4 || 'VIP'}
                </>
              ) : receipt.paymentMethod === 'VietQR' ? (
                <>
                  <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                  VietQR ({receipt.bankCode || 'MB'})
                </>
              ) : (
                receipt.paymentMethod
              )}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Payer Name</span>
            <span className="font-semibold text-white truncate block text-[11px]">
              {receipt.payerName || 'RideLux Client'}
            </span>
          </div>
        </div>

        {/* Vehicle & Rental Details */}
        <div className="mb-5 p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#DFB15B]/10 text-[#DFB15B] flex items-center justify-center">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {vehicle ? `${vehicle.brand} ${vehicle.model}` : `Vehicle ID #${receipt.vehicleId}`}
                </h4>
                <span className="text-[10px] text-neutral-400">
                  {vehicle ? `Plate: ${vehicle.licensePlate} · Year: ${vehicle.year}` : 'Luxury Supercar Fleet'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-neutral-400">Duration</span>
              <span className="font-bold text-white block">{durationDays} Day{durationDays > 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs pt-1">
            <div>
              <span className="text-[10px] text-neutral-500 block uppercase font-bold">Pickup Time</span>
              <span className="font-semibold text-neutral-200">
                {pickupDate.toLocaleDateString()} · {pickupDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block uppercase font-bold">Return Time</span>
              <span className="font-semibold text-neutral-200">
                {returnDate.toLocaleDateString()} · {returnDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Itemized Financial Breakdown */}
        <div className="border-t border-b border-white/10 py-4 space-y-2 text-xs">
          <div className="flex justify-between text-neutral-400">
            <span>Vehicle Rental Fee ({durationDays} days)</span>
            <span className="font-semibold text-white">${receipt.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>Lloyd's Platinum Liability & Collision Waiver</span>
            <span className="text-emerald-400 font-semibold">INCLUDED</span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>Distributed Idempotency & Overlap Protection</span>
            <span className="text-emerald-400 font-semibold">INCLUDED</span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>24/7 VIP Concierge & Telemetry Support</span>
            <span className="text-emerald-400 font-semibold">INCLUDED</span>
          </div>
          <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-white/5">
            <span className="uppercase tracking-wider">Total Paid ({receipt.currency})</span>
            <span className="text-[#DFB15B] text-base">${receipt.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Security & Authenticity Stamp */}
        <div className="mt-5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3 text-xs text-neutral-400">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-[11px] leading-relaxed">
            This payment was cryptographically registered in the RideLux Booking Service ledger with zero double-charge guarantee.
          </span>
        </div>

        {/* Actions (hidden when printed) */}
        <div className="mt-6 flex items-center justify-end gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save Receipt
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#DFB15B] hover:bg-[#c99f52] text-black text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#DFB15B]/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
