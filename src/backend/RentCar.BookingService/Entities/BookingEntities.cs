namespace RentCar.BookingService.Entities;

public class Booking
{
    public Guid BookingId { get; set; } = Guid.NewGuid();
    public Guid CustomerUserId { get; set; }
    public long VehicleId { get; set; }
    public long PickupLocationId { get; set; }
    public long ReturnLocationId { get; set; }
    public DateTime PickupUtc { get; set; }
    public DateTime ReturnUtc { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Confirmed, Rejected, Cancelled, Active, Returned, Completed
    public decimal? TotalPrice { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? CancelledAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public byte[] RowVersion { get; set; } = Guid.NewGuid().ToByteArray();
    public DateTime? DeletedAtUtc { get; set; }

    public ICollection<BookingStatusHistory> StatusHistory { get; set; } = new List<BookingStatusHistory>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}

public class BookingStatusHistory
{
    public long BookingStatusHistoryId { get; set; }
    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = null!;
    public string? PreviousStatus { get; set; }
    public string NewStatus { get; set; } = string.Empty;
    public DateTime ChangedAtUtc { get; set; } = DateTime.UtcNow;
    public Guid? ChangedByUserId { get; set; }
    public string? Reason { get; set; }
}

public class Payment
{
    public Guid PaymentId { get; set; } = Guid.NewGuid();
    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = null!;
    public Guid CustomerUserId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string PaymentMethod { get; set; } = "CreditCard"; // CreditCard, VietQR, BankTransfer, PayPal, ApplePay
    public string Status { get; set; } = "Completed"; // Pending, Completed, Failed, Refunded
    public string TransactionReference { get; set; } = string.Empty;
    public string? CardLast4 { get; set; }
    public string? CardBrand { get; set; }
    public string? PayerName { get; set; }
    public string? BankCode { get; set; }
    public string? Note { get; set; }
    public DateTime PaidAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

public class IdempotencyRecord
{
    public Guid CustomerUserId { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty;
    public byte[] RequestHash { get; set; } = Array.Empty<byte>();
    public Guid? BookingId { get; set; }
    public short ResponseStatusCode { get; set; }
    public string ResponseBody { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAtUtc { get; set; }
}
