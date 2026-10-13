using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using RentCar.BookingService.Data;
using RentCar.BookingService.Entities;
using Xunit;

namespace RentCar.BookingService.Tests;

public class PaymentProcessingTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly BookingDbContext _db;

    public PaymentProcessingTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<BookingDbContext>()
            .UseSqlite(_connection)
            .Options;

        _db = new BookingDbContext(options);
        _db.Database.EnsureCreated();
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public void ProcessPayment_ShouldUpdateBookingStatusToConfirmed_AndRecordPayment()
    {
        // 1. Arrange: Create pending booking
        var customerId = Guid.NewGuid();
        var booking = new Booking
        {
            BookingId = Guid.NewGuid(),
            CustomerUserId = customerId,
            VehicleId = 1,
            PickupLocationId = 1,
            ReturnLocationId = 1,
            PickupUtc = DateTime.UtcNow.AddDays(1),
            ReturnUtc = DateTime.UtcNow.AddDays(3),
            Status = "Pending",
            TotalPrice = 2400.00m
        };
        _db.Bookings.Add(booking);
        _db.SaveChanges();

        // 2. Act: Record payment
        var txnRef = $"TXN-{DateTime.UtcNow:yyyyMMddHHmmss}-123456";
        var payment = new Payment
        {
            PaymentId = Guid.NewGuid(),
            BookingId = booking.BookingId,
            CustomerUserId = customerId,
            Amount = booking.TotalPrice.Value,
            Currency = "USD",
            PaymentMethod = "CreditCard",
            Status = "Completed",
            TransactionReference = txnRef,
            CardBrand = "Visa",
            CardLast4 = "8896",
            PayerName = "VIP Client",
            PaidAtUtc = DateTime.UtcNow
        };

        booking.Status = "Confirmed";
        booking.UpdatedAtUtc = DateTime.UtcNow;

        _db.Payments.Add(payment);
        _db.BookingStatusHistories.Add(new BookingStatusHistory
        {
            BookingId = booking.BookingId,
            PreviousStatus = "Pending",
            NewStatus = "Confirmed",
            ChangedAtUtc = DateTime.UtcNow,
            Reason = $"Payment received via CreditCard (${payment.Amount:N2})"
        });
        _db.SaveChanges();

        // 3. Assert
        var savedBooking = _db.Bookings
            .Include(b => b.Payments)
            .Include(b => b.StatusHistory)
            .FirstOrDefault(b => b.BookingId == booking.BookingId);

        Assert.NotNull(savedBooking);
        Assert.Equal("Confirmed", savedBooking.Status);
        Assert.Single(savedBooking.Payments);
        Assert.Equal(2400.00m, savedBooking.Payments.First().Amount);
        Assert.Equal("Completed", savedBooking.Payments.First().Status);
        Assert.Equal(txnRef, savedBooking.Payments.First().TransactionReference);
        Assert.Contains(savedBooking.StatusHistory, h => h.NewStatus == "Confirmed");
    }

    [Fact]
    public void VietQrPayment_ShouldStoreBankDetailsAndSucceed()
    {
        var customerId = Guid.NewGuid();
        var booking = new Booking
        {
            BookingId = Guid.NewGuid(),
            CustomerUserId = customerId,
            VehicleId = 2,
            PickupLocationId = 1,
            ReturnLocationId = 1,
            PickupUtc = DateTime.UtcNow.AddDays(2),
            ReturnUtc = DateTime.UtcNow.AddDays(5),
            Status = "Pending",
            TotalPrice = 3600.00m
        };
        _db.Bookings.Add(booking);
        _db.SaveChanges();

        var txnRef = $"TXN-QR-{DateTime.UtcNow:yyyyMMddHHmmss}-999";
        var payment = new Payment
        {
            PaymentId = Guid.NewGuid(),
            BookingId = booking.BookingId,
            CustomerUserId = customerId,
            Amount = 3600.00m,
            Currency = "USD",
            PaymentMethod = "VietQR",
            Status = "Completed",
            TransactionReference = txnRef,
            BankCode = "MB",
            PayerName = "Nguyen Van A",
            Note = "Napas247 Instant Transfer",
            PaidAtUtc = DateTime.UtcNow
        };

        booking.Status = "Confirmed";
        _db.Payments.Add(payment);
        _db.SaveChanges();

        var savedPayment = _db.Payments.FirstOrDefault(p => p.BookingId == booking.BookingId);
        Assert.NotNull(savedPayment);
        Assert.Equal("VietQR", savedPayment.PaymentMethod);
        Assert.Equal("MB", savedPayment.BankCode);
        Assert.Equal(3600.00m, savedPayment.Amount);
    }
}
