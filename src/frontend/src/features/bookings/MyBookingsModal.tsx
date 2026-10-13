import React, { useState, useEffect } from 'react';
import { X, Calendar, Ban, RefreshCw, CreditCard, FileText } from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { Booking, PaymentReceipt } from '../../types/booking';
import { Vehicle } from '../../types/vehicle';
import { PayBookingModal } from './PayBookingModal';
import { PaymentReceiptModal } from './PaymentReceiptModal';

interface MyBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
}

export const MyBookingsModal: React.FC<MyBookingsModalProps> = ({
  isOpen,
  onClose,
  vehicles
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Payment modal state
  const [payingBooking, setPayingBooking] = useState<Booking | null>(null);

  // Receipt modal state
  const [activeReceipt, setActiveReceipt] = useState<PaymentReceipt | null>(null);
  const [receiptVehicle, setReceiptVehicle] = useState<Vehicle | undefined>(undefined);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingService.getMyBookings();
      setBookings(res.items);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadBookings();
    }
  }, [isOpen]);

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await bookingService.cancelBooking(bookingId, cancelReason || 'Customer requested cancellation.');
      setCancellingId(null);
      setCancelReason('');
      await loadBookings();
    } catch (err: any) {
      alert(`Error cancelling booking: ${err.message}`);
    }
  };

  const handleViewReceipt = async (booking: Booking, car?: Vehicle) => {
    setReceiptLoading(true);
    try {
      const receipt = await bookingService.getPaymentReceipt(booking.bookingId);
      setActiveReceipt(receipt);
      setReceiptVehicle(car);
    } catch (err: any) {
      // If no receipt exists yet (e.g. legacy booking before payments)
      alert(err.message || 'No receipt found for this booking.');
    } finally {
      setReceiptLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-[#141414] border border-white/10 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-left text-white max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#DFB15B]">
                RESERVATION HISTORY & PAYMENTS
              </span>
              <h2 className="text-2xl font-black text-white mt-1">My Bookings</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadBookings}
                disabled={loading}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content list */}
          <div className="flex-1 overflow-y-auto py-6 space-y-4 pr-1">
            {loading && bookings.length === 0 ? (
              <div className="text-center py-12 text-xs text-neutral-500">
                Loading your reservations...
              </div>
            ) : error ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12 text-neutral-400 space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-neutral-600" />
                <p className="text-sm font-semibold">No bookings found yet</p>
                <p className="text-xs text-neutral-500">Browse our fleet to create your first luxury reservation.</p>
              </div>
            ) : (
              bookings.map((b) => {
                const car = vehicles.find((v) => v.id === b.vehicleId);
                const isEligibleForCancel = b.status === 'Pending' || b.status === 'Confirmed';
                const isPaid = b.isPaid || b.paymentStatus === 'Paid';

                const getStatusBadge = (status: string) => {
                  switch (status) {
                    case 'Pending':
                      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                    case 'Confirmed':
                      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                    case 'Active':
                      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                    case 'Returned':
                    case 'Completed':
                      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
                    case 'Cancelled':
                    case 'Rejected':
                      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                    default:
                      return 'bg-neutral-800 text-neutral-400 border-neutral-700';
                  }
                };

                return (
                  <div
                    key={b.bookingId}
                    className="p-5 rounded-2xl bg-neutral-900 border border-white/5 hover:border-white/10 transition-colors flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-base font-bold text-white">
                          {car ? `${car.brand} ${car.model}` : `Vehicle ID #${b.vehicleId}`}
                        </h4>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          Ref: {b.bookingId.slice(0, 8)}...
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPaid && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                            PAID
                          </span>
                        )}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(b.status)}`}>
                          {b.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-neutral-400 bg-neutral-950/50 p-3 rounded-xl border border-white/5">
                      <div>
                        <span className="text-[10px] text-neutral-500 block">Pickup UTC</span>
                        <span className="font-semibold text-neutral-200">
                          {new Date(b.pickupUtc).toLocaleDateString()} · {new Date(b.pickupUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 block">Return UTC</span>
                        <span className="font-semibold text-neutral-200">
                          {new Date(b.returnUtc).toLocaleDateString()} · {new Date(b.returnUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs flex-wrap gap-2">
                      <span className="font-semibold text-neutral-300">
                        Total: <span className="text-[#DFB15B] font-bold">${b.totalPrice ?? 0}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Unpaid Pending Booking -> Pay Now Button */}
                        {b.status === 'Pending' && !isPaid && (
                          <button
                            onClick={() => setPayingBooking(b)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#DFB15B] hover:bg-[#c99f52] text-black text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-[#DFB15B]/20"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Pay Now
                          </button>
                        )}

                        {/* Paid or Confirmed Booking -> View Receipt Button */}
                        {(isPaid || b.status === 'Confirmed' || b.status === 'Active' || b.status === 'Completed') && (
                          <button
                            onClick={() => handleViewReceipt(b, car)}
                            disabled={receiptLoading}
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#DFB15B]" />
                            Receipt
                          </button>
                        )}

                        {/* Cancel Option */}
                        {isEligibleForCancel && (
                          <div>
                            {cancellingId === b.bookingId ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Reason (optional)"
                                  value={cancelReason}
                                  onChange={(e) => setCancelReason(e.target.value)}
                                  className="px-2.5 py-1 rounded-lg bg-neutral-800 border border-white/10 text-xs text-white outline-none w-36"
                                />
                                <button
                                  onClick={() => handleCancelBooking(b.bookingId)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setCancellingId(null)}
                                  className="text-xs text-neutral-400 hover:text-white cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setCancellingId(b.bookingId)}
                                className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Ban className="w-3 h-3" />
                                Cancel
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Pay Booking Modal */}
      {payingBooking && (
        <PayBookingModal
          isOpen={!!payingBooking}
          onClose={() => setPayingBooking(null)}
          booking={payingBooking}
          vehicle={vehicles.find(v => v.id === payingBooking.vehicleId)}
          onPaymentSuccess={(receipt) => {
            setActiveReceipt(receipt);
            setReceiptVehicle(vehicles.find(v => v.id === payingBooking.vehicleId));
            setPayingBooking(null);
            loadBookings();
          }}
        />
      )}

      {/* Payment Receipt Modal */}
      {activeReceipt && (
        <PaymentReceiptModal
          isOpen={!!activeReceipt}
          onClose={() => setActiveReceipt(null)}
          receipt={activeReceipt}
          vehicle={receiptVehicle}
        />
      )}
    </>
  );
};
