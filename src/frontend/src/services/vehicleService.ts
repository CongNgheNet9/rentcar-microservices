import { request } from './api';
import { Location, PagedResponse, Vehicle, VehicleType } from '../types/vehicle';

export const vehicleService = {
  async getVehicles(params: {
    vehicleTypeId?: number;
    locationId?: number;
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<PagedResponse<Vehicle>> {
    const searchParams = new URLSearchParams();
    if (params.vehicleTypeId) searchParams.set('vehicleTypeId', params.vehicleTypeId.toString());
    if (params.locationId) searchParams.set('locationId', params.locationId.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const query = searchParams.toString();
    return await request<PagedResponse<Vehicle>>(`/api/vehicles${query ? `?${query}` : ''}`);
  },

  async getVehicleById(vehicleId: number): Promise<Vehicle> {
    return await request<Vehicle>(`/api/vehicles/${vehicleId}`);
  },

  async getVehicleTypes(): Promise<VehicleType[]> {
    return await request<VehicleType[]>('/api/vehicle-types');
  },

  async getLocations(): Promise<Location[]> {
    return await request<Location[]>('/api/locations');
  },

  // Admin endpoints
  async adminGetVehicles(params: {
    vehicleTypeId?: number;
    locationId?: number;
    status?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  } = {}): Promise<PagedResponse<Vehicle>> {
    const searchParams = new URLSearchParams();
    if (params.vehicleTypeId) searchParams.set('vehicleTypeId', params.vehicleTypeId.toString());
    if (params.locationId) searchParams.set('locationId', params.locationId.toString());
    if (params.status) searchParams.set('status', params.status);
    if (params.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const query = searchParams.toString();
    return await request<PagedResponse<Vehicle>>(`/api/admin/vehicles${query ? `?${query}` : ''}`);
  },

  async adminCreateVehicle(payload: {
    vehicleTypeId: number;
    locationId: number;
    licensePlate: string;
    brand: string;
    model: string;
    year: number;
    imageUrl?: string;
    pricePerDay: number;
  }): Promise<Vehicle> {
    return await request<Vehicle>('/api/admin/vehicles', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async adminUpdateVehicle(id: number, payload: Partial<Vehicle>): Promise<Vehicle> {
    return await request<Vehicle>(`/api/admin/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async adminDeactivateVehicle(id: number): Promise<void> {
    await request<void>(`/api/admin/vehicles/${id}/deactivate`, {
      method: 'PATCH'
    });
  },

  async adminGetVehicleTypes(): Promise<VehicleType[]> {
    return await request<VehicleType[]>('/api/admin/vehicle-types');
  },

  async adminCreateVehicleType(payload: { name: string; description?: string }): Promise<VehicleType> {
    return await request<VehicleType>('/api/admin/vehicle-types', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async adminDeactivateVehicleType(id: number): Promise<void> {
    await request<void>(`/api/admin/vehicle-types/${id}/deactivate`, {
      method: 'PATCH'
    });
  },

  async adminGetLocations(): Promise<Location[]> {
    return await request<Location[]>('/api/admin/locations');
  },

  async adminCreateLocation(payload: { name: string; description?: string }): Promise<Location> {
    return await request<Location>('/api/admin/locations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async adminDeactivateLocation(id: number): Promise<void> {
    await request<void>(`/api/admin/locations/${id}/deactivate`, {
      method: 'PATCH'
    });
  }
};
