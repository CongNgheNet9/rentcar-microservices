export interface Booking {
  bookingId: string;
  customerUserId: string;
  vehicleId: number;
  pickupLocationId: number;
  returnLocationId: number;
  pickupUtc: string;
  returnUtc: string;
  status: 'Pending' | 'Confirmed' | 'Rejected' | 'Cancelled' | 'Active' | 'Returned' | 'Completed';
  totalPrice?: number;
  isPaid?: boolean;
  paymentStatus?: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  cancelledAtUtc?: string;
  completedAtUtc?: string;
}

export interface BookingDetail extends Booking {
  statusHistory: BookingStatusHistory[];
  latestPayment?: PaymentReceipt;
}

export interface BookingStatusHistory {
  bookingStatusHistoryId: number;
  previousStatus?: string;
  newStatus: string;
  changedAtUtc: string;
  changedByUserId?: string;
  reason?: string;
}

export interface CheckAvailabilityPayload {
  vehicleId: number;
  pickupUtc: string;
  returnUtc: string;
  pickupLocationId?: number;
  returnLocationId?: number;
}

export interface AvailabilityResponse {
  isAvailable: boolean;
  reason?: string;
  overlappingBookingId?: string;
}

export interface CreateBookingPayload {
  vehicleId: number;
  pickupLocationId: number;
  returnLocationId: number;
  pickupUtc: string;
  returnUtc: string;
  isDirectPickup?: boolean;
}

export interface ProcessPaymentPayload {
  paymentMethod: 'CreditCard' | 'VietQR' | 'BankTransfer' | 'PayPal' | 'ApplePay' | string;
  cardNumber?: string;
  cardHolderName?: string;
  expiryDate?: string;
  cvv?: string;
  bankCode?: string;
  payerNote?: string;
}

export interface PaymentReceipt {
  paymentId: string;
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  transactionReference: string;
  cardLast4?: string;
  cardBrand?: string;
  payerName?: string;
  bankCode?: string;
  note?: string;
  paidAtUtc: string;
  pickupUtc: string;
  returnUtc: string;
  vehicleId: number;
}
