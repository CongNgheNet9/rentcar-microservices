import { request } from './api';
import {
  AvailabilityResponse,
  Booking,
  BookingDetail,
  CheckAvailabilityPayload,
  CreateBookingPayload,
  ProcessPaymentPayload,
  PaymentReceipt
} from '../types/booking';
import { PagedResponse } from '../types/vehicle';

export const bookingService = {
  async checkAvailability(payload: CheckAvailabilityPayload): Promise<AvailabilityResponse> {
    return await request<AvailabilityResponse>('/bookings/availability', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async createBooking(
    payload: CreateBookingPayload,
    idempotencyKey?: string
  ): Promise<Booking> {
    const key = idempotencyKey || `key-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    return await request<Booking>('/bookings', {
      method: 'POST',
      headers: {
        'Idempotency-Key': key
      },
      body: JSON.stringify(payload)
    });
  },

  async getBookingById(bookingId: string): Promise<BookingDetail> {
    return await request<BookingDetail>(`/bookings/${bookingId}`);
  },

  async getMyBookings(params: {
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<PagedResponse<Booking>> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const query = searchParams.toString();
    return await request<PagedResponse<Booking>>(`/bookings${query ? `?${query}` : ''}`);
  },

  async payBooking(bookingId: string, payload: ProcessPaymentPayload): Promise<PaymentReceipt> {
    return await request<PaymentReceipt>(`/bookings/${bookingId}/pay`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getPaymentReceipt(bookingId: string): Promise<PaymentReceipt> {
    return await request<PaymentReceipt>(`/bookings/${bookingId}/payment`);
  },

  async cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
    return await request<Booking>(`/bookings/${bookingId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  // Admin operations
  async adminGetBookings(params: {
    status?: string;
    vehicleId?: number;
    customerUserId?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<PagedResponse<Booking>> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.vehicleId) searchParams.set('vehicleId', params.vehicleId.toString());
    if (params.customerUserId) searchParams.set('customerUserId', params.customerUserId);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const query = searchParams.toString();
    return await request<PagedResponse<Booking>>(`/bookings${query ? `?${query}` : ''}`);
  },

  async confirmBooking(bookingId: string): Promise<Booking> {
    return await request<Booking>(`/bookings/${bookingId}/confirm`, {
      method: 'POST'
    });
  },

  async rejectBooking(bookingId: string, reason?: string): Promise<Booking> {
    return await request<Booking>(`/bookings/${bookingId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  async recordPickup(bookingId: string): Promise<Booking> {
    return await request<Booking>(`/bookings/${bookingId}/pickup`, {
      method: 'POST'
    });
  },

  async recordReturn(bookingId: string): Promise<Booking> {
    return await request<Booking>(`/bookings/${bookingId}/return`, {
      method: 'POST'
    });
  },

  async completeBooking(bookingId: string): Promise<Booking> {
    return await request<Booking>(`/bookings/${bookingId}/complete`, {
      method: 'POST'
    });
  }
};
