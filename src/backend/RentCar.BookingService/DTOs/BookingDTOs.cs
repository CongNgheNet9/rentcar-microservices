using System.ComponentModel.DataAnnotations;

namespace RentCar.BookingService.DTOs;

public class CreateBookingRequest
{
    [Required]
    public long VehicleId { get; set; }

    [Required]
    public long PickupLocationId { get; set; }

    [Required]
    public long ReturnLocationId { get; set; }

    [Required]
    public DateTime PickupUtc { get; set; }

    [Required]
    public DateTime ReturnUtc { get; set; }

    public bool IsDirectPickup { get; set; } = false;
}

public class CheckAvailabilityRequest
{
    [Required]
    public long VehicleId { get; set; }

    public long? PickupLocationId { get; set; }
    public long? ReturnLocationId { get; set; }

    [Required]
    public DateTime PickupUtc { get; set; }

    [Required]
    public DateTime ReturnUtc { get; set; }
}

public class AvailabilityResponse
{
    public bool IsAvailable { get; set; }
    public string? Reason { get; set; }
    public Guid? OverlappingBookingId { get; set; }
}

public class BookingDto
{
    public Guid BookingId { get; set; }
    public Guid CustomerUserId { get; set; }
    public long VehicleId { get; set; }
    public long PickupLocationId { get; set; }
    public long ReturnLocationId { get; set; }
    public DateTime PickupUtc { get; set; }
    public DateTime ReturnUtc { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal? TotalPrice { get; set; }
    public bool IsPaid { get; set; }
    public string? PaymentStatus { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public DateTime? CancelledAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
}

public class BookingDetailDto : BookingDto
{
    public List<BookingStatusHistoryDto> StatusHistory { get; set; } = new();
    public PaymentReceiptDto? LatestPayment { get; set; }
}

public class BookingStatusHistoryDto
{
    public long BookingStatusHistoryId { get; set; }
    public string? PreviousStatus { get; set; }
    public string NewStatus { get; set; } = string.Empty;
    public DateTime ChangedAtUtc { get; set; }
    public Guid? ChangedByUserId { get; set; }
    public string? Reason { get; set; }
}

public class ProcessPaymentRequest
{
    [Required]
    public string PaymentMethod { get; set; } = "CreditCard"; // CreditCard, VietQR, BankTransfer, PayPal, ApplePay

    public string? CardNumber { get; set; }
    public string? CardHolderName { get; set; }
    public string? ExpiryDate { get; set; } // MM/YY
    public string? Cvv { get; set; }

    public string? BankCode { get; set; } // MB, VCB, etc.
    public string? PayerNote { get; set; }
}

public class PaymentReceiptDto
{
    public Guid PaymentId { get; set; }
    public Guid BookingId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string PaymentMethod { get; set; } = "CreditCard";
    public string Status { get; set; } = "Completed";
    public string TransactionReference { get; set; } = string.Empty;
    public string? CardLast4 { get; set; }
    public string? CardBrand { get; set; }
    public string? PayerName { get; set; }
    public string? BankCode { get; set; }
    public string? Note { get; set; }
    public DateTime PaidAtUtc { get; set; }
    public DateTime PickupUtc { get; set; }
    public DateTime ReturnUtc { get; set; }
    public long VehicleId { get; set; }
}

public class CancelBookingRequest
{
    [StringLength(500)]
    public string? Reason { get; set; }
}

public class RejectBookingRequest
{
    [StringLength(500)]
    public string? Reason { get; set; }
}

public class VehicleEligibilityResponse
{
    public long VehicleId { get; set; }
    public bool IsEligible { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public decimal PricePerDay { get; set; }
    public string? IneligibleReason { get; set; }
}

public class PagedResponse<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
