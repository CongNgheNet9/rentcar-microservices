import React, { useState } from 'react';
import { X, CreditCard, QrCode, Shield, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { Booking, PaymentReceipt } from '../../types/booking';
import { Vehicle } from '../../types/vehicle';
import { bookingService } from '../../services/bookingService';

interface PayBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  vehicle?: Vehicle;
  onPaymentSuccess: (receipt: PaymentReceipt) => void;
}

export const PayBookingModal: React.FC<PayBookingModalProps> = ({
  isOpen,
  onClose,
  booking,
  vehicle,
  onPaymentSuccess
}) => {
  const [method, setMethod] = useState<'CreditCard' | 'VietQR' | 'PayPal'>('CreditCard');
  
  // Card fields
  const [cardNumber, setCardNumber] = useState('4532 8920 4410 8896');
  const [cardHolder, setCardHolder] = useState('ALEXANDER MORGAN');
  const [expiry, setExpiry] = useState('08/29');
  const [cvv, setCvv] = useState('888');

  // VietQR fields
  const [bankCode, setBankCode] = useState('MB');

  // Submission state
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  const totalAmount = booking.totalPrice ?? 0;
  const bookingRef = booking.bookingId.slice(0, 8).toUpperCase();

  const handleFillDemoCard = () => {
    setCardNumber('4532 9988 7766 5544');
    setCardHolder('EMILY WATSON');
    setExpiry('11/28');
    setCvv('921');
  };

  const handleProcessPayment = async () => {
    setLoading(true);
    setError(null);
    setStatusMessage('Connecting to secure banking gateway...');

    try {
      // Simulate realistic payment gateway authorization sequence
      await new Promise(r => setTimeout(r, 600));
      setStatusMessage('Authorizing transaction & verifying ledger...');
      await new Promise(r => setTimeout(r, 600));

      const payload = {
        paymentMethod: method,
        cardNumber: method === 'CreditCard' ? cardNumber : undefined,
        cardHolderName: method === 'CreditCard' ? cardHolder : 'RideLux Verified Client',
        expiryDate: method === 'CreditCard' ? expiry : undefined,
        cvv: method === 'CreditCard' ? cvv : undefined,
        bankCode: method === 'VietQR' ? bankCode : undefined,
        payerNote: `Booking #${bookingRef} settled via ${method}`
      };

      const receipt = await bookingService.payBooking(booking.bookingId, payload);
      setStatusMessage('Payment verified! Booking confirmed.');
      await new Promise(r => setTimeout(r, 400));

      onPaymentSuccess(receipt);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Payment processing failed. Please check payment details.');
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#121212] border border-[#DFB15B]/30 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative text-left text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="pb-4 border-b border-white/10">
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#DFB15B]">
            RIDELUX SECURE CHECKOUT
          </span>
          <h2 className="text-2xl font-black text-white mt-1">Complete Payment</h2>
          <div className="flex items-center justify-between text-xs text-neutral-400 mt-2">
            <span>
              Reservation: <strong className="text-white">{vehicle ? `${vehicle.brand} ${vehicle.model}` : `#${bookingRef}`}</strong>
            </span>
            <span className="text-base font-black text-[#DFB15B]">
              ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Payment Method Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 my-5">
          <button
            type="button"
            onClick={() => setMethod('CreditCard')}
            className={`py-3 px-2 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              method === 'CreditCard'
                ? 'bg-[#DFB15B]/15 border-[#DFB15B] text-[#DFB15B]'
                : 'bg-white/[0.03] border-white/5 text-neutral-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Credit Card</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('VietQR')}
            className={`py-3 px-2 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              method === 'VietQR'
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                : 'bg-white/[0.03] border-white/5 text-neutral-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>VietQR / Napas</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('PayPal')}
            className={`py-3 px-2 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              method === 'PayPal'
                ? 'bg-blue-500/15 border-blue-500 text-blue-400'
                : 'bg-white/[0.03] border-white/5 text-neutral-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>PayPal VIP</span>
          </button>
        </div>

        {/* Tab 1: Credit Card */}
        {method === 'CreditCard' && (
          <div className="space-y-4">
            {/* Virtual Card Graphic */}
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-neutral-900 via-neutral-800 to-neutral-900 border border-white/10 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#DFB15B]/10 rounded-full blur-2xl" />
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] tracking-widest text-[#DFB15B] font-black uppercase">RIDELUX PLATINUM</span>
                <span className="text-xs font-mono font-bold tracking-wider text-neutral-300">VISA</span>
              </div>
              <div className="font-mono text-base font-bold tracking-widest text-neutral-200 mb-4">
                {cardNumber || '•••• •••• •••• ••••'}
              </div>
              <div className="flex justify-between text-[10px] text-neutral-400 uppercase">
                <div>
                  <span className="block text-[8px] text-neutral-500">CARDHOLDER</span>
                  <span className="font-semibold text-neutral-200">{cardHolder || 'VALUED CLIENT'}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-neutral-500">EXPIRES</span>
                  <span className="font-semibold text-neutral-200">{expiry || 'MM/YY'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleFillDemoCard}
                className="text-[11px] text-[#DFB15B] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                Fill Demo VIP Card
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4532 0000 0000 0000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs outline-none focus:border-[#DFB15B]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Cardholder Name</label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                  placeholder="FULL NAME ON CARD"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-[#DFB15B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Expiration</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs outline-none focus:border-[#DFB15B]"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">CVV / CVC</label>
                  <input
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="•••"
                    maxLength={4}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs outline-none focus:border-[#DFB15B]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: VietQR / Napas 247 */}
        {method === 'VietQR' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-center gap-4">
              {/* Styled Mock VietQR Code */}
              <div className="w-36 h-36 bg-white p-2 rounded-xl flex flex-col items-center justify-between shrink-0 shadow-lg">
                <div className="w-full flex items-center justify-between px-1">
                  <span className="text-[8px] font-black text-blue-700 tracking-tighter">VIETQR</span>
                  <span className="text-[8px] font-black text-red-600">NAPAS 247</span>
                </div>
                {/* SVG QR Code Pattern */}
                <svg className="w-24 h-24 text-black" viewBox="0 0 100 100" fill="currentColor">
                  {/* Outer corner squares */}
                  <rect x="5" y="5" width="26" height="26" fill="black" />
                  <rect x="9" y="9" width="18" height="18" fill="white" />
                  <rect x="13" y="13" width="10" height="10" fill="black" />

                  <rect x="69" y="5" width="26" height="26" fill="black" />
                  <rect x="73" y="9" width="18" height="18" fill="white" />
                  <rect x="77" y="13" width="10" height="10" fill="black" />

                  <rect x="5" y="69" width="26" height="26" fill="black" />
                  <rect x="9" y="73" width="18" height="18" fill="white" />
                  <rect x="13" y="77" width="10" height="10" fill="black" />

                  {/* Random QR matrix data blocks */}
                  <rect x="37" y="10" width="8" height="8" />
                  <rect x="50" y="8" width="6" height="6" />
                  <rect x="38" y="24" width="6" height="6" />
                  <rect x="50" y="20" width="10" height="10" />
                  <rect x="10" y="38" width="8" height="8" />
                  <rect x="24" y="42" width="6" height="6" />
                  <rect x="36" y="38" width="10" height="10" />
                  <rect x="52" y="38" width="6" height="6" />
                  <rect x="64" y="38" width="8" height="8" />
                  <rect x="80" y="40" width="8" height="8" />
                  <rect x="38" y="54" width="8" height="8" />
                  <rect x="52" y="52" width="12" height="12" />
                  <rect x="70" y="54" width="8" height="8" />
                  <rect x="84" y="56" width="6" height="6" />
                  <rect x="38" y="72" width="8" height="8" />
                  <rect x="50" y="70" width="8" height="8" />
                  <rect x="64" y="74" width="10" height="10" />
                  <rect x="80" y="72" width="12" height="12" />
                </svg>
                <span className="text-[7px] text-neutral-500 font-bold uppercase tracking-wider">Scan via Banking App</span>
              </div>

              {/* Bank Account Details */}
              <div className="flex-1 space-y-2 text-xs w-full">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-[10px] text-neutral-400 block">Bank Name</span>
                  <span className="font-bold text-white block">MB Bank (Military Commercial Bank)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-[10px] text-neutral-400 block">Account Number</span>
                  <span className="font-mono font-bold text-[#DFB15B] text-sm block">0988 7766 55</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-[10px] text-neutral-400 block">Account Name</span>
                  <span className="font-bold text-white block">RIDELUX VIETNAM LLC</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-[10px] text-neutral-400 block">Transfer Note</span>
                  <span className="font-mono font-bold text-emerald-400 block">RIDELUX {bookingRef}</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 text-center">
              Scan QR code with any banking app (Vietcombank, MB, Techcombank, VPBank) or click below to simulate instant transfer confirmation.
            </p>
          </div>
        )}

        {/* Tab 3: PayPal VIP */}
        {method === 'PayPal' && (
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">PayPal Express Checkout</h4>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Authenticate via PayPal One Touch for instant payment with Buyer Protection guarantee.
            </p>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Status indicator during submission */}
        {statusMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-6">
          <button
            onClick={handleProcessPayment}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#DFB15B] hover:bg-[#c99f52] active:scale-[0.99] text-black font-extrabold text-xs tracking-wider uppercase transition-all shadow-lg shadow-[#DFB15B]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Authorizing Transaction...</span>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>
                  Pay ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} & Confirm
                </span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
