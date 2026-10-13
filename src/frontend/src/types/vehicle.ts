export interface Vehicle {
  id: number;
  vehicleTypeId: number;
  vehicleTypeName: string;
  locationId: number;
  locationName: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  status: 'Available' | 'Maintenance' | 'Unavailable' | 'Retired';
  isActive: boolean;
  imageUrl?: string;
  pricePerDay: number;
}

export interface VehicleType {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Location {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}
