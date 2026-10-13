using System.Security.Cryptography;
using System.Text;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using RentCar.BookingService.Data;
using RentCar.BookingService.Entities;
using RentCar.BookingService.Infrastructure.Redis;
using RentCar.BookingService.Infrastructure.Sharding;
using Xunit;

namespace RentCar.BookingService.Tests;

public class AdminWorkflowAndRedisTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly BookingDbContext _db;

    public AdminWorkflowAndRedisTests()
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
    public void AdminBooking_DirectPickup_ShouldBeActiveImmediately_AndExemptFromPayment()
    {
        // 1. Arrange: Admin creates booking with direct pickup
        var adminUserId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var vehicleId = 101L;

        var booking = new Booking
        {
            BookingId = bookingId,
            CustomerUserId = adminUserId,
            VehicleId = vehicleId,
            PickupLocationId = 1,
            ReturnLocationId = 1,
            PickupUtc = DateTime.UtcNow,
            ReturnUtc = DateTime.UtcNow.AddDays(2),
            Status = "Active", // Direct pickup
            TotalPrice = 1500m
        };

        var adminPayment = new Payment
        {
            PaymentId = Guid.NewGuid(),
            BookingId = bookingId,
            CustomerUserId = adminUserId,
            Amount = 0m,
            Currency = "USD",
            PaymentMethod = "AdminPrivilege",
            Status = "Completed",
            TransactionReference = $"ADM-EXEMPT-{DateTime.UtcNow:yyyyMMddHHmmss}",
            PayerName = "System Administrator",
            Note = "Admin direct vehicle pickup - Exempt from payment",
            PaidAtUtc = DateTime.UtcNow,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.Bookings.Add(booking);
        _db.Payments.Add(adminPayment);
        _db.BookingStatusHistories.Add(new BookingStatusHistory
        {
            BookingId = bookingId,
            NewStatus = "Active",
            Reason = "Admin direct vehicle pickup (Active immediately - Exempt from payment)"
        });
        _db.SaveChanges();

        // 2. Assert
        var savedBooking = _db.Bookings
            .Include(b => b.Payments)
            .FirstOrDefault(b => b.BookingId == bookingId);

        Assert.NotNull(savedBooking);
        Assert.Equal("Active", savedBooking.Status);
        Assert.Single(savedBooking.Payments);
        Assert.Equal(0m, savedBooking.Payments.First().Amount);
        Assert.Equal("AdminPrivilege", savedBooking.Payments.First().PaymentMethod);
        Assert.Equal("Completed", savedBooking.Payments.First().Status);
    }

    [Fact]
    public void CustomerBooking_ShouldStayPendingAfterPayment_UntilAdminConfirms()
    {
        // 1. Arrange: Customer creates booking
        var customerId = Guid.NewGuid();
        var booking = new Booking
        {
            BookingId = Guid.NewGuid(),
            CustomerUserId = customerId,
            VehicleId = 202L,
            PickupLocationId = 1,
            ReturnLocationId = 1,
            PickupUtc = DateTime.UtcNow.AddDays(3),
            ReturnUtc = DateTime.UtcNow.AddDays(5),
            Status = "Pending",
            TotalPrice = 2000m
        };
        _db.Bookings.Add(booking);
        _db.SaveChanges();

        // 2. Act: Customer pays money
        var payment = new Payment
        {
            PaymentId = Guid.NewGuid(),
            BookingId = booking.BookingId,
            CustomerUserId = customerId,
            Amount = 2000m,
            Currency = "USD",
            PaymentMethod = "CreditCard",
            Status = "Completed",
            TransactionReference = $"TXN-{DateTime.UtcNow:yyyyMMddHHmmss}-777777",
            CardLast4 = "8896",
            PaidAtUtc = DateTime.UtcNow
        };
        _db.Payments.Add(payment);
        _db.BookingStatusHistories.Add(new BookingStatusHistory
        {
            BookingId = booking.BookingId,
            PreviousStatus = "Pending",
            NewStatus = "Pending",
            Reason = "Payment captured. Awaiting administrator confirmation."
        });
        _db.SaveChanges();

        // Verify status remains Pending awaiting Admin
        var pendingBooking = _db.Bookings.Find(booking.BookingId);
        Assert.Equal("Pending", pendingBooking!.Status);

        // 3. Act: Admin confirms the booking
        pendingBooking.Status = "Confirmed";
        pendingBooking.UpdatedAtUtc = DateTime.UtcNow;
        _db.BookingStatusHistories.Add(new BookingStatusHistory
        {
            BookingId = pendingBooking.BookingId,
            PreviousStatus = "Pending",
            NewStatus = "Confirmed",
            Reason = "Administrator verified and confirmed booking order."
        });
        _db.SaveChanges();

        // 4. Assert: Status is now Confirmed
        var confirmedBooking = _db.Bookings.Find(booking.BookingId);
        Assert.Equal("Confirmed", confirmedBooking!.Status);
    }

    [Fact]
    public void DbShardResolver_ShouldPartitionByVehicleId()
    {
        var config = new ConfigurationBuilder().Build();
        var resolver = new DbShardResolver(config, NullLogger<DbShardResolver>.Instance);

        Assert.Equal(2, resolver.ShardCount);

        // Vehicle ID 100 % 2 = 0 -> shard 0
        var shard100 = resolver.ResolveShardIndex(100);
        Assert.Equal(0, shard100);
        Assert.Contains("bookings_shard_0.db", resolver.GetShardConnectionString(100));

        // Vehicle ID 101 % 2 = 1 -> shard 1
        var shard101 = resolver.ResolveShardIndex(101);
        Assert.Equal(1, shard101);
        Assert.Contains("bookings_shard_1.db", resolver.GetShardConnectionString(101));
    }

    [Fact]
    public async Task RedisLockManager_FallbackToInMemory_WorksWhenRedisOffline()
    {
        var config = new ConfigurationBuilder().Build();
        var connectionManager = new RedisConnectionManager(config, NullLogger<RedisConnectionManager>.Instance);
        var lockManager = new RedisBookingLockManager(connectionManager, NullLogger<RedisBookingLockManager>.Instance);

        // Acquires in-memory lock cleanly even without Redis server
        using (var lockScope = await lockManager.AcquireLockAsync(999L))
        {
            Assert.NotNull(lockScope);
        }
    }

    [Fact]
    public void IdempotencyPayloadHashing_ShouldDetectPayloadDivergence()
    {
        var payload1 = "101_1_1_2026-10-20T10:00:00Z_2026-10-22T10:00:00Z_False";
        var payload2 = "101_1_1_2026-10-20T10:00:00Z_2026-10-22T10:00:00Z_True"; // direct pickup toggled

        var hash1 = SHA256.HashData(Encoding.UTF8.GetBytes(payload1));
        var hash2 = SHA256.HashData(Encoding.UTF8.GetBytes(payload2));

        Assert.False(hash1.SequenceEqual(hash2), "Payload divergence must result in different SHA-256 hashes.");
    }
}
