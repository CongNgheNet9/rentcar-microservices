using RentCar.BookingService.Infrastructure.Redis;

namespace RentCar.BookingService.Services;

public class BookingLockManager : IBookingLockManager
{
    private readonly IBookingLockManager _underlyingLockManager;

    public BookingLockManager(IBookingLockManager underlyingLockManager)
    {
        _underlyingLockManager = underlyingLockManager;
    }

    public Task<IDisposable> AcquireLockAsync(long vehicleId, CancellationToken cancellationToken = default)
    {
        return _underlyingLockManager.AcquireLockAsync(vehicleId, cancellationToken);
    }
}
