import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Settings,
  MapPin,
  Calendar,
  CreditCard,
  Send,
  Mic,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Shield,
  Zap,
  Sliders,
  User as UserIcon,
  X,
  ChevronLeft,
  ChevronRight,
  QrCode
} from 'lucide-react';
import { Vehicle, Location } from '../../types/vehicle';
import { User } from '../../types/auth';
import { bookingService } from '../../services/bookingService';
import { AvailabilityResponse, PaymentReceipt } from '../../types/booking';
import { PaymentReceiptModal } from '../bookings/PaymentReceiptModal';

interface VehicleDetailPageProps {
  vehicle: Vehicle;
  locations: Location[];
  currentUser: User | null;
  onBack: () => void;
  onOpenAuth: () => void;
  onBookingSuccess: () => void;
}

export const VehicleDetailPage: React.FC<VehicleDetailPageProps> = ({
  vehicle,
  locations,
  currentUser,
  onBack,
  onOpenAuth,
  onBookingSuccess
}) => {
  // Mode tabs
  const [activeMode, setActiveMode] = useState<'Rent' | 'Buy' | 'Sell'>('Rent');

  // Locations
  const [pickupLocId, setPickupLocId] = useState<number>(vehicle.locationId || (locations[0]?.id ?? 1));
  const [returnLocId, setReturnLocId] = useState<number>(vehicle.locationId || (locations[0]?.id ?? 1));

  // Dates (Default next 3 days)
  const defaultPickup = new Date();
  defaultPickup.setDate(defaultPickup.getDate() + 1);
  defaultPickup.setHours(9, 0, 0, 0);

  const defaultReturn = new Date();
  defaultReturn.setDate(defaultReturn.getDate() + 4);
  defaultReturn.setHours(18, 0, 0, 0);

  const [pickupDate, setPickupDate] = useState<string>(defaultPickup.toISOString().slice(0, 16));
  const [returnDate, setReturnDate] = useState<string>(defaultReturn.toISOString().slice(0, 16));

  // Availability state
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<AvailabilityResponse | null>(null);

  // Booking & Payment state
  const [paymentMethod, setPaymentMethod] = useState<'CreditCard' | 'VietQR' | 'PayPal'>('CreditCard');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccessModal, setBookingSuccessModal] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<PaymentReceipt | null>(null);
  const [adminSuccessModal, setAdminSuccessModal] = useState<{ status: string; message: string; bookingId: string } | null>(null);

  // AI Assistant Chat state
  const [showAiWidget, setShowAiWidget] = useState(true);
  const [aiInput, setAiInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: `Hello! I'm your RideLux AI Concierge. I can help arrange booking for the ${vehicle.brand} ${vehicle.model}, verify availability, or configure rental options.`
    }
  ]);

  // Calculated rental price
  const pickupTime = new Date(pickupDate).getTime();
  const returnTime = new Date(returnDate).getTime();
  const durationDays = Math.max(1, Math.ceil((returnTime - pickupTime) / (1000 * 60 * 60 * 24)));
  const estimatedTotal = durationDays * vehicle.pricePerDay;

  const handleCheckAvailability = async () => {
    setCheckingAvailability(true);
    setAvailabilityResult(null);
    setBookingError(null);

    try {
      const res = await bookingService.checkAvailability({
        vehicleId: vehicle.id,
        pickupUtc: new Date(pickupDate).toISOString(),
        returnUtc: new Date(returnDate).toISOString(),
        pickupLocationId: pickupLocId,
        returnLocationId: returnLocId
      });
      setAvailabilityResult(res);
    } catch (err: any) {
      setBookingError(err.message || 'Failed to check availability.');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleCreateBooking = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      // Client-generated logical idempotency key
      const idempotencyKey = `bk-${currentUser.userId}-${vehicle.id}-${Date.now()}`;

      await bookingService.createBooking(
        {
          vehicleId: vehicle.id,
          pickupLocationId: pickupLocId,
          returnLocationId: returnLocId,
          pickupUtc: new Date(pickupDate).toISOString(),
          returnUtc: new Date(returnDate).toISOString()
        },
        idempotencyKey
      );

      setBookingSuccessModal(true);
    } catch (err: any) {
      setBookingError(err.message || 'Unable to create booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleAdminBooking = async (isDirectPickup: boolean) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      const idempotencyKey = `adm-${currentUser.userId}-${vehicle.id}-${Date.now()}`;
      const newBooking = await bookingService.createBooking(
        {
          vehicleId: vehicle.id,
          pickupLocationId: pickupLocId,
          returnLocationId: returnLocId,
          pickupUtc: new Date(pickupDate).toISOString(),
          returnUtc: new Date(returnDate).toISOString(),
          isDirectPickup
        },
        idempotencyKey
      );

      setAdminSuccessModal({
        status: newBooking.status,
        message: isDirectPickup
          ? 'Đã lấy xe trực tiếp thành công! Trạng thái: Đang hoạt động (Active). Miễn phí thanh toán 100% cho Quản trị viên.'
          : 'Đã tạo đơn đặt xe thành công cho Quản trị viên! Trạng thái: Đã xác nhận (Confirmed). Miễn phí thanh toán 100%.',
        bookingId: newBooking.bookingId
      });
    } catch (err: any) {
      setBookingError(err.message || 'Lỗi xử lý đặt xe cho Quản trị viên.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handlePayAndConfirm = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      const idempotencyKey = `bk-${currentUser.userId}-${vehicle.id}-${Date.now()}`;

      // 1. Create booking (Customer booking is created with Pending status)
      const newBooking = await bookingService.createBooking(
        {
          vehicleId: vehicle.id,
          pickupLocationId: pickupLocId,
          returnLocationId: returnLocId,
          pickupUtc: new Date(pickupDate).toISOString(),
          returnUtc: new Date(returnDate).toISOString()
        },
        idempotencyKey
      );

      // 2. Process customer payment
      const receipt = await bookingService.payBooking(newBooking.bookingId, {
        paymentMethod,
        cardNumber: paymentMethod === 'CreditCard' ? '4532 8920 4410 8896' : undefined,
        cardHolderName: currentUser.name,
        expiryDate: '08/29',
        cvv: '888',
        bankCode: paymentMethod === 'VietQR' ? 'MB' : undefined,
        payerNote: `Instant luxury checkout for ${vehicle.brand} ${vehicle.model}`
      });

      receipt.note = 'Thanh toán thành công! Đơn đặt xe đang chờ Quản trị viên (Admin) duyệt xác nhận.';

      setCompletedReceipt(receipt);
    } catch (err: any) {
      setBookingError(err.message || 'Payment processing failed.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleSendAiPrompt = (promptText?: string) => {
    const textToSend = promptText || aiInput;
    if (!textToSend.trim()) return;

    setChatMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    setAiInput('');

    setTimeout(() => {
      let reply = '';
      const lower = textToSend.toLowerCase();

      if (lower.includes('book') || lower.includes('rent')) {
        reply = `I have pre-selected the ${vehicle.brand} ${vehicle.model} from ${new Date(pickupDate).toLocaleDateString()} to ${new Date(returnDate).toLocaleDateString()}. Estimated total is $${estimatedTotal}. Click "Check Availability" or "Confirm Booking" below to proceed.`;
      } else if (lower.includes('damage') || lower.includes('analysis')) {
        reply = `Complete digital inspection completed on 12th Oct 2026. Zero structural or cosmetic defects detected. High-resolution telemetry active.`;
      } else if (lower.includes('insurance') || lower.includes('plan')) {
        reply = `RideLux Platinum Coverage includes $1,000,000 third-party liability, zero-deductible collision damage waiver, and 24/7 roadside recovery.`;
      } else if (lower.includes('payment') || lower.includes('calculate')) {
        reply = `Daily rate is $${vehicle.pricePerDay} × ${durationDays} days = $${estimatedTotal}. No hidden franchise fees.`;
      } else {
        reply = `I've noted: "${textToSend}". Our microservice booking engine enforces strict concurrency overlap protection so your vehicle reservation is 100% guaranteed once confirmed.`;
      }

      setChatMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#EBECEE] text-slate-800 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* 1. Detail Header Component */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        {/* Left: 'Q' Logo mark */}
        <div className="flex items-center gap-3">
          <div 
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-lg shadow-md cursor-pointer hover:bg-slate-800 transition-colors"
          >
            Q
          </div>
          <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">FLEET OS</span>
        </div>

        {/* Center: Mode tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
          {(['Rent', 'Buy', 'Sell'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`px-6 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === mode
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Right: Location & settings */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Your Location: Los Angeles</span>
          </div>

          <button
            onClick={onBack}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Showroom
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Top Split: Left Toolbar + Vehicle Display + AI Assistant Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* 2. Left Quick Toolbar */}
          <div className="hidden lg:flex lg:col-span-1 flex-col gap-3 items-center py-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <button className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 transition-colors cursor-pointer" title="Driver Profile">
              <UserIcon className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 transition-colors cursor-pointer" title="Vehicle Controls">
              <Sliders className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center" title="Electric System">
              <Zap className="w-5 h-5" />
            </button>
            <div className="w-6 h-px bg-slate-200 my-2" />
            <button className="w-10 h-10 rounded-xl text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer">
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* 3. Main Vehicle Display Component */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[460px]">
            {/* Header section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={onBack}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Fleet Overview
                </button>

                {/* Technical badge [L] R F B with L in emerald green */}
                <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wider">
                  <span className="text-emerald-600 font-extrabold bg-emerald-100 px-1 rounded">[L]</span>
                  <span className="text-slate-400">R</span>
                  <span className="text-slate-400">F</span>
                  <span className="text-slate-400">B</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mt-4 text-left">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    {vehicle.brand} {vehicle.model}
                  </h1>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
                    {vehicle.vehicleTypeName} · {vehicle.year} Model
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">Daily Rate</span>
                  <div className="text-2xl font-black text-emerald-600">
                    ${vehicle.pricePerDay}
                    <span className="text-xs text-slate-400 font-normal"> / day</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Hero Center Image */}
            <div className="my-6 relative flex items-center justify-center">
              <div className="w-full max-w-lg aspect-[16/9] rounded-2xl overflow-hidden shadow-lg border border-slate-100 bg-slate-50">
                <img
                  src={vehicle.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80'}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Status pill */}
              <div className="absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-md text-emerald-700 shadow-sm border border-emerald-100 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Operational: {vehicle.status}
              </div>
            </div>

            {/* Bottom mini telemetry metrics */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-left">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">License</span>
                <span className="text-xs font-extrabold text-slate-800">{vehicle.licensePlate}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Transmission</span>
                <span className="text-xs font-extrabold text-slate-800">Dual Motor AWD</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Range / Tank</span>
                <span className="text-xs font-extrabold text-slate-800">420 km / Full</span>
              </div>
            </div>
          </div>

          {/* 4. AI Assistant Floating Widget Component */}
          {showAiWidget && (
            <div className="lg:col-span-4 bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/80 shadow-xl flex flex-col justify-between min-h-[460px] text-left">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">AI Assistant</h3>
                      <p className="text-[11px] text-slate-400">How can I help you today?</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAiWidget(false)}
                    className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Chat message display */}
                <div className="my-4 space-y-3 max-h-48 overflow-y-auto pr-1 text-xs">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-2xl ${
                        msg.sender === 'ai'
                          ? 'bg-slate-100 text-slate-800 rounded-tl-sm'
                          : 'bg-emerald-600 text-white rounded-tr-sm ml-auto'
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>

                {/* Quick Prompt Cards Grid (2x2) */}
                <div className="grid grid-cols-2 gap-2 my-3">
                  <button
                    onClick={() => handleSendAiPrompt('Book a rent (5 min)')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/60 text-left transition-colors cursor-pointer group"
                  >
                    <span className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-700 block">Book a rent</span>
                    <span className="text-[9px] text-slate-400">5 min flow</span>
                  </button>

                  <button
                    onClick={() => handleSendAiPrompt('Analysis (Damages)')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/60 text-left transition-colors cursor-pointer group"
                  >
                    <span className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-700 block">Analysis</span>
                    <span className="text-[9px] text-slate-400">Damages check</span>
                  </button>

                  <button
                    onClick={() => handleSendAiPrompt('Insurance (Pick a Plan)')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/60 text-left transition-colors cursor-pointer group"
                  >
                    <span className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-700 block">Insurance</span>
                    <span className="text-[9px] text-slate-400">Pick a Plan</span>
                  </button>

                  <button
                    onClick={() => handleSendAiPrompt('Payment (Calculate)')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/60 text-left transition-colors cursor-pointer group"
                  >
                    <span className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-700 block">Payment</span>
                    <span className="text-[9px] text-slate-400">Calculate total</span>
                  </button>
                </div>
              </div>

              {/* Input Box Component */}
              <div className="pt-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendAiPrompt();
                  }}
                  className="relative rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-emerald-500 focus-within:bg-white transition-all shadow-sm"
                >
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Arrange to rent this car for 8am..."
                    className="w-full bg-transparent px-2 text-xs text-slate-800 placeholder-slate-400 outline-none pb-8"
                  />
                  
                  {/* Toolbar inside input */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <button type="button" className="p-1 hover:text-slate-600 rounded cursor-pointer">
                        <Mic className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" className="p-1 hover:text-slate-600 rounded cursor-pointer">
                        <Paperclip className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" className="p-1 hover:text-slate-600 rounded cursor-pointer">
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* 5. Bottom Dashboard Cards Component (Lưới thẻ thông tin bổ trợ) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          
          {/* Card 1: My Location Widget */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">1. Pickup & Return</span>
                <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold">📍</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Pickup Location</label>
                  <select
                    value={pickupLocId}
                    onChange={(e) => setPickupLocId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Return Location</label>
                  <select
                    value={returnLocId}
                    onChange={(e) => setReturnLocId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Stylized mini map badge */}
            <div className="mt-4 p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-900 block">Hub Delivery Included</span>
                <span className="text-[10px] text-emerald-700">Immediate pickup ready upon arrival</span>
              </div>
            </div>
          </div>

          {/* Card 2: My Dates Widget */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">2. Rental Period</span>
                <Calendar className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Pickup Date & Time (UTC)</label>
                  <input
                    type="datetime-local"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Return Date & Time (UTC)</label>
                  <input
                    type="datetime-local"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Check Availability Button */}
            <div className="mt-4">
              <button
                onClick={handleCheckAvailability}
                disabled={checkingAvailability}
                className="w-full py-2.5 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {checkingAvailability ? (
                  <span>Checking Availability...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Check Live Availability</span>
                  </>
                )}
              </button>

              {/* Advisory availability result indicator */}
              {availabilityResult && (
                <div className={`mt-2 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  availabilityResult.isAvailable
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {availabilityResult.isAvailable ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Vehicle is 100% available for this timeframe!</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{availabilityResult.reason || 'Unavailable due to overlapping reservation.'}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Payment Method & Instant Checkout Widget */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">3. Payment & Settlement</span>
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CreditCard')}
                  className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === 'CreditCard'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('VietQR')}
                  className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === 'VietQR'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>VietQR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('PayPal')}
                  className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === 'PayPal'
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>PayPal</span>
                </button>
              </div>

              {/* Selected Method Detail Preview */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {paymentMethod === 'CreditCard' ? (
                    <>
                      <div className="w-8 h-5 rounded bg-slate-900 text-white text-[8px] font-black flex items-center justify-center tracking-wider">
                        VISA
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">RideLux VIP Card</span>
                        <span className="text-[10px] text-slate-400 font-mono">•••• 8896 (Exp 08/29)</span>
                      </div>
                    </>
                  ) : paymentMethod === 'VietQR' ? (
                    <>
                      <div className="w-8 h-5 rounded bg-blue-600 text-white text-[7px] font-black flex items-center justify-center tracking-tighter">
                        NAPAS
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">VietQR 24/7 (MB Bank)</span>
                        <span className="text-[10px] text-slate-400 font-mono">STK: 0988 7766 55</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-5 rounded bg-blue-500 text-white text-[8px] font-black flex items-center justify-center tracking-wider">
                        PP
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">PayPal VIP Checkout</span>
                        <span className="text-[10px] text-slate-400">One-touch instant charge</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="w-4 h-4 rounded-full border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>

              {/* Price summary */}
              <div className="space-y-1 text-xs text-slate-500 pt-1.5 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>${vehicle.pricePerDay} × {durationDays} days</span>
                  <span className="font-semibold text-slate-800">${estimatedTotal}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Platinum Insurance & Overlap Lock</span>
                  <span>Active (Free)</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-100">
                  <span>Total Due</span>
                  <span className="text-emerald-600">${estimatedTotal}</span>
                </div>
              </div>
            </div>

            {/* Confirm & Pay buttons */}
            <div className="mt-3 space-y-2">
              {bookingError && (
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              {currentUser?.role === 'Admin' ? (
                /* Admin Privilege Workflow */
                <div className="space-y-2.5">
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs flex items-start gap-2.5">
                    <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold block text-amber-800 uppercase tracking-wider text-[11px]">
                        ĐẶC QUYỀN QUẢN TRỊ VIÊN (ADMIN)
                      </span>
                      <span className="text-slate-600 text-[11px] leading-tight block mt-0.5">
                        Tài khoản Admin không cần thanh toán. Có thể lấy xe trực tiếp đưa vào trạng thái Hoạt động (Active) hoặc đặt xe trước.
                      </span>
                    </div>
                  </div>

                  {/* Primary Admin: Direct Pickup */}
                  <button
                    onClick={() => handleAdminBooking(true)}
                    disabled={bookingLoading}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs tracking-wider uppercase transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {bookingLoading ? (
                      <span>Đang xử lý...</span>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Admin Lấy Xe Trực Tiếp (Active Ngay)</span>
                      </>
                    )}
                  </button>

                  {/* Secondary Admin: Confirmed Pre-booking without payment */}
                  <button
                    onClick={() => handleAdminBooking(false)}
                    disabled={bookingLoading}
                    className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Admin Đặt Xe Trước (Miễn Phí)</span>
                  </button>
                </div>
              ) : (
                /* Customer Workflow */
                <>
                  {/* Primary action: Instant Pay & Submit for Admin Approval */}
                  <button
                    onClick={handlePayAndConfirm}
                    disabled={bookingLoading}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs tracking-wider uppercase transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {bookingLoading ? (
                      <span>Đang xử lý thanh toán...</span>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Thanh Toán ${estimatedTotal} & Đặt Xe</span>
                      </>
                    )}
                  </button>

                  {/* Secondary action: Reserve pending approval without immediate payment */}
                  <button
                    onClick={handleCreateBooking}
                    disabled={bookingLoading}
                    className="w-full py-2 rounded-xl text-slate-500 hover:text-slate-800 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Đặt giữ chỗ trước, thanh toán sau →
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Privilege Success Modal */}
      {adminSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
              <Shield className="w-10 h-10" />
            </div>

            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              ADMIN PRIVILEGE GRANTED
            </span>
            <h3 className="text-2xl font-black text-slate-900 mt-2">
              {adminSuccessModal.status === 'Active' ? 'Đã Lấy Xe Trực Tiếp!' : 'Đặt Xe Thành Công!'}
            </h3>
            <p className="text-xs text-slate-600 mt-2 mb-6">
              {adminSuccessModal.message}
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-left space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-400">Trạng thái</span>
                <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded">
                  {adminSuccessModal.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thanh toán</span>
                <span className="font-extrabold text-emerald-600">Miễn phí 100% (Admin Exempt)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thời gian thuê</span>
                <span className="font-semibold text-slate-800">{durationDays} Ngày</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mã đơn</span>
                <span className="font-mono text-slate-600">{adminSuccessModal.bookingId.slice(0, 8)}...</span>
              </div>
            </div>

            <button
              onClick={() => {
                setAdminSuccessModal(null);
                onBookingSuccess();
              }}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Hoàn tất & Xem Danh Sách Đặt Xe
            </button>
          </div>
        </div>
      )}

      {/* Success Modal (Reserve without payment) */}
      {bookingSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-black text-slate-900">Booking Reserved!</h3>
            <p className="text-xs text-slate-500 mt-2 mb-6">
              Your rental reservation for the <strong className="text-slate-800">{vehicle.brand} {vehicle.model}</strong> has been secured. You can complete payment at any time from your Bookings dashboard.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-left space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Pending Payment</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Price</span>
                <span className="font-extrabold text-slate-800">${estimatedTotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rental Period</span>
                <span className="font-semibold text-slate-800">{durationDays} Days</span>
              </div>
            </div>

            <button
              onClick={() => {
                setBookingSuccessModal(false);
                onBookingSuccess();
              }}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              View My Bookings
            </button>
          </div>
        </div>
      )}

      {/* Instant Payment Receipt Modal */}
      {completedReceipt && (
        <PaymentReceiptModal
          isOpen={!!completedReceipt}
          onClose={() => {
            setCompletedReceipt(null);
            onBookingSuccess();
          }}
          receipt={completedReceipt}
          vehicle={vehicle}
        />
      )}
    </div>
  );
};
