import React, { useState, useEffect } from 'react';
import { NavigationHeader } from './components/common/NavigationHeader';
import { HeroSection } from './features/home/HeroSection';
import { StatsBar } from './features/home/StatsBar';
import { BrandPartners } from './features/home/BrandPartners';
import { CarShowcase } from './features/home/CarShowcase';
import { DestinationsSection } from './features/home/DestinationsSection';
import { ExperiencesSection } from './features/home/ExperiencesSection';
import { AboutSection } from './features/home/AboutSection';
import { VehicleDetailPage } from './features/vehicles/VehicleDetailPage';
import { AuthModal } from './features/auth/AuthModal';
import { MyBookingsModal } from './features/bookings/MyBookingsModal';
import { AdminDashboardModal } from './features/admin/AdminDashboardModal';

import { authService } from './services/authService';
import { vehicleService } from './services/vehicleService';
import { User } from './types/auth';
import { Vehicle, VehicleType, Location } from './types/vehicle';

export const App: React.FC = () => {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getSavedUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBookingsModalOpen, setIsBookingsModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Data state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // View state: selected vehicle details page
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, tRes, lRes] = await Promise.all([
        vehicleService.getVehicles({ vehicleTypeId: selectedTypeId || undefined }),
        vehicleService.getVehicleTypes(),
        vehicleService.getLocations()
      ]);
      setVehicles(vRes.items);
      setVehicleTypes(tRes);
      setLocations(lRes);
    } catch (err) {
      console.error('Error fetching catalog data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedTypeId]);

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const handleBrowseCars = () => {
    setSelectedVehicle(null);
    const el = document.getElementById('cars-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavigateSection = (sectionId: string) => {
    if (selectedVehicle) {
      setSelectedVehicle(null);
    }
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  // If a vehicle is selected, display the Detail & Dashboard Page
  if (selectedVehicle) {
    return (
      <VehicleDetailPage
        vehicle={selectedVehicle}
        locations={locations}
        currentUser={currentUser}
        onBack={() => setSelectedVehicle(null)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onBookingSuccess={() => {
          setSelectedVehicle(null);
          setIsBookingsModalOpen(true);
        }}
      />
    );
  }

  // Otherwise, display the Home Page (RideLux Luxury Theme)
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-slate-100 flex flex-col font-sans">
      {/* 1. Navigation Header */}
      <NavigationHeader
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenBookings={() => {
          if (!currentUser) {
            setIsAuthModalOpen(true);
          } else {
            setIsBookingsModalOpen(true);
          }
        }}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onNavigateHome={() => {
          setSelectedVehicle(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onBrowseCars={handleBrowseCars}
        onNavigateSection={handleNavigateSection}
      />

      <main className="flex-1">
        {/* 2. Hero Section */}
        <HeroSection onBrowseCars={handleBrowseCars} />

        {/* 3. Stats Bar */}
        <StatsBar />

        {/* 4. Brand Partners */}
        <BrandPartners />

        {/* 5. Car Showcase with Filters */}
        <CarShowcase
          vehicles={vehicles}
          vehicleTypes={vehicleTypes}
          selectedTypeId={selectedTypeId}
          onSelectType={setSelectedTypeId}
          onSelectVehicle={(v) => setSelectedVehicle(v)}
        />

        {/* 6. Iconic Destinations Section */}
        <DestinationsSection onBrowseCars={handleBrowseCars} />

        {/* 7. Curated Bespoke Experiences */}
        <ExperiencesSection onBrowseCars={handleBrowseCars} />

        {/* 8. About RideLux & Architecture Standards */}
        <AboutSection />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black py-12 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#DFB15B] text-black font-extrabold flex items-center justify-center text-xs">
              R
            </div>
            <span className="font-bold tracking-widest text-white">RIDELUX</span>
          </div>
          <p className="max-w-md mx-auto">
            Vehicle Rental System built with ASP.NET Core .NET 8 Microservices (UserService, VehicleService, BookingService, YARP Gateway) & React TypeScript.
          </p>
          <div className="text-neutral-600">
            © 2026 RIDELUX Technologies Inc. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
        }}
      />

      <MyBookingsModal
        isOpen={isBookingsModalOpen}
        onClose={() => setIsBookingsModalOpen(false)}
        vehicles={vehicles}
      />

      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onFleetUpdated={fetchData}
      />
    </div>
  );
};
