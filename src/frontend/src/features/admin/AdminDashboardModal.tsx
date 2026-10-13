import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Car,
  Layers,
  MapPin,
  Calendar,
  Check,
  Ban,
  ArrowRight,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { vehicleService } from '../../services/vehicleService';
import { Booking } from '../../types/booking';
import { Location, Vehicle, VehicleType } from '../../types/vehicle';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFleetUpdated: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  onFleetUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'vehicles' | 'types' | 'locations'>('bookings');

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Vehicles state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [types, setTypes] = useState<VehicleType[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Create vehicle form state
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newYear, setNewYear] = useState(2024);
  const [newPrice, setNewPrice] = useState(499);
  const [newTypeId, setNewTypeId] = useState<number>(1);
  const [newLocId, setNewLocId] = useState<number>(1);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Create type & location form state
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');
  const [newLocName, setNewLocName] = useState('');
  const [newLocDesc, setNewLocDesc] = useState('');

  const loadData = async () => {
    if (activeTab === 'bookings') {
      setLoadingBookings(true);
      try {
        const res = await bookingService.adminGetBookings();
        setBookings(res.items);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoadingBookings(false);
      }
    } else {
      setLoadingVehicles(true);
      try {
        const [vRes, tRes, lRes] = await Promise.all([
          vehicleService.adminGetVehicles(),
          vehicleService.adminGetVehicleTypes(),
          vehicleService.adminGetLocations()
        ]);
        setVehicles(vRes.items);
        setTypes(tRes);
        setLocations(lRes);
        if (tRes[0]) setNewTypeId(tRes[0].id);
        if (lRes[0]) setNewLocId(lRes[0].id);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoadingVehicles(false);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeTab]);

  // Booking lifecycle actions
  const handleConfirm = async (id: string) => {
    await bookingService.confirmBooking(id);
    await loadData();
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Reason for rejection:');
    if (reason !== null) {
      await bookingService.rejectBooking(id, reason);
      await loadData();
    }
  };

  const handlePickup = async (id: string) => {
    await bookingService.recordPickup(id);
    await loadData();
  };

  const handleReturn = async (id: string) => {
    await bookingService.recordReturn(id);
    await loadData();
  };

  const handleComplete = async (id: string) => {
    await bookingService.completeBooking(id);
    await loadData();
  };

  // Vehicle action
  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await vehicleService.adminCreateVehicle({
        brand: newBrand,
        model: newModel,
        licensePlate: newPlate,
        year: newYear,
        pricePerDay: newPrice,
        vehicleTypeId: newTypeId,
        locationId: newLocId,
        imageUrl: newImageUrl || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'
      });
      setShowAddVehicle(false);
      setNewBrand('');
      setNewModel('');
      setNewPlate('');
      await loadData();
      onFleetUpdated();
    } catch (err: any) {
      alert(`Error creating vehicle: ${err.message}`);
    }
  };

  const handleDeactivateVehicle = async (id: number) => {
    if (confirm('Deactivate this vehicle from active rental service?')) {
      await vehicleService.adminDeactivateVehicle(id);
      await loadData();
      onFleetUpdated();
    }
  };

  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    await vehicleService.adminCreateVehicleType({ name: newTypeName, description: newTypeDesc });
    setNewTypeName('');
    setNewTypeDesc('');
    await loadData();
    onFleetUpdated();
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) return;
    await vehicleService.adminCreateLocation({ name: newLocName, description: newLocDesc });
    setNewLocName('');
    setNewLocDesc('');
    await loadData();
    onFleetUpdated();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-white/10 rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl relative text-left text-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-400">
                OPERATIONAL CONSOLE
              </span>
              <h2 className="text-2xl font-black text-white">Administrator Hub</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-white/5">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Bookings Lifecycle
          </button>

          <button
            onClick={() => setActiveTab('vehicles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'vehicles'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Car className="w-4 h-4" />
            Vehicles Fleet
          </button>

          <button
            onClick={() => setActiveTab('types')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'types'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            Vehicle Types
          </button>

          <button
            onClick={() => setActiveTab('locations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'locations'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Locations
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto py-6 space-y-4 pr-1">
          {/* TAB 1: BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="space-y-3">
              {loadingBookings ? (
                <div className="text-center py-12 text-xs text-neutral-500">Loading bookings...</div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12 text-xs text-neutral-500">No bookings in system.</div>
              ) : (
                bookings.map((b) => {
                  const isPaid = b.isPaid || b.paymentStatus === 'Paid';
                  return (
                    <div
                      key={b.bookingId}
                      className="p-4 rounded-2xl bg-neutral-900 border border-white/5 hover:border-white/10 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-white">
                            #{b.bookingId.slice(0, 8)}...
                          </span>
                          <span className="text-xs text-neutral-400">· Xe #{b.vehicleId}</span>
                          
                          {/* Lifecycle Status Badge */}
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                            b.status === 'Pending'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : b.status === 'Confirmed'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : b.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : b.status === 'Returned'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                              : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                          }`}>
                            {b.status === 'Pending' ? '🟡 Chờ Admin Duyệt' : b.status}
                          </span>

                          {/* Payment Status Badge */}
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                            isPaid
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}>
                            {isPaid ? '✓ Đã Thanh Toán' : '⚠ Chưa Thanh Toán'}
                          </span>
                        </div>

                        <div className="text-xs text-neutral-400 flex flex-wrap items-center gap-3">
                          <span>
                            Thời gian: {new Date(b.pickupUtc).toLocaleDateString()} → {new Date(b.returnUtc).toLocaleDateString()}
                          </span>
                          {b.totalPrice && (
                            <span className="text-[#DFB15B] font-bold">
                              Tổng tiền: ${b.totalPrice}
                            </span>
                          )}
                          <span className="text-neutral-500 font-mono text-[11px]">
                            Khách: {b.customerUserId.slice(0, 8)}...
                          </span>
                        </div>
                      </div>

                      {/* Operational Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {b.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleConfirm(b.bookingId)}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                              title="Xác nhận duyệt cho khách thuê xe"
                            >
                              <span>✓ Xác Nhận Duyệt Xe</span>
                            </button>
                            <button
                              onClick={() => handleReject(b.bookingId)}
                              className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                            >
                              <span>✗ Từ Chối</span>
                            </button>
                          </>
                        )}

                        {b.status === 'Confirmed' && (
                          <button
                            onClick={() => handlePickup(b.bookingId)}
                            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>🚗 Bàn Giao Xe → Active</span>
                          </button>
                        )}

                        {b.status === 'Active' && (
                          <button
                            onClick={() => handleReturn(b.bookingId)}
                            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>📥 Nhận Lại Xe → Returned</span>
                          </button>
                        )}

                        {b.status === 'Returned' && (
                          <button
                            onClick={() => handleComplete(b.bookingId)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black transition-all shadow-md shadow-emerald-700/20 flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>🏁 Hoàn Tất Thủ Tục</span>
                          </button>
                        )}

                        {(b.status === 'Completed' || b.status === 'Cancelled' || b.status === 'Rejected') && (
                          <span className="text-xs text-neutral-500 italic">Đã kết thúc chu kỳ</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: VEHICLES */}
          {activeTab === 'vehicles' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">Total Fleet: {vehicles.length} vehicles</span>
                <button
                  onClick={() => setShowAddVehicle(!showAddVehicle)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {showAddVehicle ? 'Close Form' : 'Add Vehicle'}
                </button>
              </div>

              {/* Add vehicle form */}
              {showAddVehicle && (
                <form onSubmit={handleCreateVehicle} className="p-5 rounded-2xl bg-neutral-900 border border-emerald-500/30 space-y-3">
                  <h4 className="text-sm font-bold text-emerald-400">Add New Vehicle to Inventory</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Brand (e.g. Porsche)"
                      required
                      value={newBrand}
                      onChange={(e) => setNewBrand(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-xs text-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Model (e.g. 911 GT3)"
                      required
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-xs text-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder="License Plate"
                      required
                      value={newPlate}
                      onChange={(e) => setNewPlate(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-xs text-white outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      type="number"
                      placeholder="Year"
                      required
                      value={newYear}
                      onChange={(e) => setNewYear(Number(e.target.value))}
                      className="px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-xs text-white outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Price per day"
                      required
                      value={newPrice}
                      onChange={(e) => setNewPrice(Number(e.target.value))}
                      className="px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-xs text-white outline-none"
                    />
                    <select
                      value={newTypeId}
                      onChange={(e) => setNewTypeId(Number(e.target.value))}
                      className="px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-xs text-white outline-none"
                    >
                      {types.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <select
                      value={newLocId}
                      onChange={(e) => setNewLocId(Number(e.target.value))}
                      className="px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-xs text-white outline-none"
                    >
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="url"
                    placeholder="Image URL (optional)"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-xs text-white outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Save Vehicle
                  </button>
                </form>
              )}

              {/* Vehicle list */}
              <div className="space-y-2">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-950 shrink-0">
                        <img src={v.imageUrl} alt={v.model} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-white">
                          {v.brand} {v.model} ({v.year})
                        </div>
                        <div className="text-neutral-400 text-[11px]">
                          Plate: {v.licensePlate} · {v.vehicleTypeName} · ${v.pricePerDay}/day
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        v.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-800 text-neutral-500'
                      }`}>
                        {v.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {v.isActive && (
                        <button
                          onClick={() => handleDeactivateVehicle(v.id)}
                          className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-semibold cursor-pointer"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TYPES */}
          {activeTab === 'types' && (
            <div className="space-y-4">
              <form onSubmit={handleCreateType} className="p-4 rounded-2xl bg-neutral-900 border border-white/5 flex gap-2">
                <input
                  type="text"
                  placeholder="Category Name (e.g. Hypercar)"
                  required
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-xs text-white outline-none"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newTypeDesc}
                  onChange={(e) => setNewTypeDesc(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-xs text-white outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 cursor-pointer"
                >
                  Add Type
                </button>
              </form>

              <div className="space-y-2">
                {types.map((t) => (
                  <div key={t.id} className="p-3 rounded-xl bg-neutral-900 border border-white/5 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white">{t.name}</span>
                      <p className="text-neutral-400 text-[11px]">{t.description || 'No description'}</p>
                    </div>
                    <span className="text-neutral-500 text-[11px]">ID #{t.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: LOCATIONS */}
          {activeTab === 'locations' && (
            <div className="space-y-4">
              <form onSubmit={handleCreateLocation} className="p-4 rounded-2xl bg-neutral-900 border border-white/5 flex gap-2">
                <input
                  type="text"
                  placeholder="Location Name (e.g. Monaco Hub)"
                  required
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-xs text-white outline-none"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newLocDesc}
                  onChange={(e) => setNewLocDesc(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-xs text-white outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 cursor-pointer"
                >
                  Add Location
                </button>
              </form>

              <div className="space-y-2">
                {locations.map((l) => (
                  <div key={l.id} className="p-3 rounded-xl bg-neutral-900 border border-white/5 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white">{l.name}</span>
                      <p className="text-neutral-400 text-[11px]">{l.description || 'No description'}</p>
                    </div>
                    <span className="text-neutral-500 text-[11px]">ID #{l.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
