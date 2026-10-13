using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using RentCar.BookingService.Data;
using RentCar.BookingService.Entities;
using Xunit;

namespace RentCar.BookingService.Tests;

public class BookingOverlapTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly BookingDbContext _db;
    private static readonly string[] ReservationHoldingStatuses = { "Pending", "Confirmed", "Active" };

    public BookingOverlapTests()
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

    private bool CheckOverlap(long vehicleId, DateTime pickupUtc, DateTime returnUtc)
    {
        return _db.Bookings.Any(b =>
            b.VehicleId == vehicleId &&
            ReservationHoldingStatuses.Contains(b.Status) &&
            b.PickupUtc < returnUtc &&
            b.ReturnUtc > pickupUtc);
    }

    [Fact]
    public void AdjacentBookings_ShouldNotOverlap()
    {
        // Existing: 10:00 to 12:00
        var existing = new Booking
        {
            BookingId = Guid.NewGuid(),
            CustomerUserId = Guid.NewGuid(),
            VehicleId = 1,
            PickupLocationId = 1,
            ReturnLocationId = 1,
            PickupUtc = new DateTime(2026, 10, 20, 10, 0, 0, DateTimeKind.Utc),
            ReturnUtc = new DateTime(2026, 10, 20, 12, 0, 0, DateTimeKind.Utc),
            Status = "Confirmed"
        };
        _db.Bookings.Add(existing);
        _db.SaveChanges();

        // New adjacent: 12:00 to 14:00
        var newPickup = new DateTime(2026, 10, 20, 12, 0, 0, DateTimeKind.Utc);
        var newReturn = new DateTime(2026, 10, 20, 14, 0, 0, DateTimeKind.Utc);

        var hasOverlap = CheckOverlap(1, newPickup, newReturn);

        Assert.False(hasOverlap, "Adjacent booking where start equals previous end should not overlap.");
    }

    [Fact]
    public void PartialOverlappingBooking_ShouldBeDetected()
    {
        // Existing: 10:00 to 14:00
        var existing = new Booking
        {
            BookingId = Guid.NewGuid(),
            CustomerUserId = Guid.NewGuid(),
            VehicleId = 1,
            PickupLocationId = 1,
            ReturnLocationId = 1,
            PickupUtc = new DateTime(2026, 10, 20, 10, 0, 0, DateTimeKind.Utc),
            ReturnUtc = new DateTime(2026, 10, 20, 14, 0, 0, DateTimeKind.Utc),
            Status = "Pending"
        };
        _db.Bookings.Add(existing);
        _db.SaveChanges();

        // New: 12:00 to 16:00
        var newPickup = new DateTime(2026, 10, 20, 12, 0, 0, DateTimeKind.Utc);
        var newReturn = new DateTime(2026, 10, 20, 16, 0, 0, DateTimeKind.Utc);

        var hasOverlap = CheckOverlap(1, newPickup, newReturn);

        Assert.True(hasOverlap, "Overlapping booking from 12:00 to 16:00 must be detected.");
    }

    [Fact]
    public void CancelledOrRejectedBookings_ShouldNotBlockNewBooking()
    {
        // Cancelled booking during 10:00 to 14:00
        var cancelled = new Booking
        {
            BookingId = Guid.NewGuid(),
            CustomerUserId = Guid.NewGuid(),
            VehicleId = 1,
            PickupLocationId = 1,
            ReturnLocationId = 1,
            PickupUtc = new DateTime(2026, 10, 20, 10, 0, 0, DateTimeKind.Utc),
            ReturnUtc = new DateTime(2026, 10, 20, 14, 0, 0, DateTimeKind.Utc),
            Status = "Cancelled"
        };
        _db.Bookings.Add(cancelled);
        _db.SaveChanges();

        var newPickup = new DateTime(2026, 10, 20, 10, 0, 0, DateTimeKind.Utc);
        var newReturn = new DateTime(2026, 10, 20, 14, 0, 0, DateTimeKind.Utc);

        var hasOverlap = CheckOverlap(1, newPickup, newReturn);

        Assert.False(hasOverlap, "Cancelled bookings must not block new reservations.");
    }

    [Fact]
    public void DifferentVehicles_ShouldNotBlockEachOther()
    {
        // Vehicle 1 has booking
        var v1Booking = new Booking
        {
            BookingId = Guid.NewGuid(),
            CustomerUserId = Guid.NewGuid(),
            VehicleId = 1,
            PickupLocationId = 1,
            ReturnLocationId = 1,
            PickupUtc = new DateTime(2026, 10, 20, 10, 0, 0, DateTimeKind.Utc),
            ReturnUtc = new DateTime(2026, 10, 20, 14, 0, 0, DateTimeKind.Utc),
            Status = "Confirmed"
        };
        _db.Bookings.Add(v1Booking);
        _db.SaveChanges();

        // Check Vehicle 2 for the same period
        var newPickup = new DateTime(2026, 10, 20, 10, 0, 0, DateTimeKind.Utc);
        var newReturn = new DateTime(2026, 10, 20, 14, 0, 0, DateTimeKind.Utc);

        var hasOverlap = CheckOverlap(2, newPickup, newReturn);

        Assert.False(hasOverlap, "Bookings on different vehicles are completely independent.");
    }
}
