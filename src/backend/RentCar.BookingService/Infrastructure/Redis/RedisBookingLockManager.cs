using System.Collections.Concurrent;
using StackExchange.Redis;

namespace RentCar.BookingService.Infrastructure.Redis;

public interface IBookingLockManager
{
    Task<IDisposable> AcquireLockAsync(long vehicleId, CancellationToken cancellationToken = default);
}

public class RedisBookingLockManager : IBookingLockManager
{
    private readonly IRedisConnectionManager _redis;
    private readonly ILogger<RedisBookingLockManager> _logger;
    private static readonly ConcurrentDictionary<long, SemaphoreSlim> _inMemoryLocks = new();

    private const string ReleaseLockLuaScript = @"
        if redis.call('get', KEYS[1]) == ARGV[1] then
            return redis.call('del', KEYS[1])
        else
            return 0
        end";

    public RedisBookingLockManager(
        IRedisConnectionManager redis,
        ILogger<RedisBookingLockManager> logger)
    {
        _redis = redis;
        _logger = logger;
    }

    public async Task<IDisposable> AcquireLockAsync(long vehicleId, CancellationToken cancellationToken = default)
    {
        // 1. Acquire local in-memory lock first to serialize within current instance
        var localSemaphore = _inMemoryLocks.GetOrAdd(vehicleId, _ => new SemaphoreSlim(1, 1));
        await localSemaphore.WaitAsync(cancellationToken);

        // 2. Try Redis distributed lock across all service instances & replicas
        var redisDb = _redis.GetMasterDatabase(vehicleId);
        if (redisDb != null)
        {
            var lockKey = $"lock:vehicle:{vehicleId}";
            var lockValue = Guid.NewGuid().ToString("N");
            var lockExpiry = TimeSpan.FromSeconds(15);
            var maxWaitTime = TimeSpan.FromSeconds(5);
            var startTime = DateTime.UtcNow;

            while (DateTime.UtcNow - startTime < maxWaitTime)
            {
                cancellationToken.ThrowIfCancellationRequested();

                try
                {
                    bool acquired = await redisDb.StringSetAsync(lockKey, lockValue, lockExpiry, When.NotExists);
                    if (acquired)
                    {
                        _logger.LogDebug("Acquired Redis distributed lock for vehicle {VehicleId}", vehicleId);
                        return new DistributedLockReleaser(redisDb, lockKey, lockValue, localSemaphore, _logger);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Redis lock error for vehicle {VehicleId}. Using local lock fallback.", vehicleId);
                    // Fall back to local lock releaser
                    return new LocalLockReleaser(localSemaphore);
                }

                await Task.Delay(50, cancellationToken);
            }

            _logger.LogWarning("Timed out acquiring Redis lock for vehicle {VehicleId}. Falling back to in-memory lock.", vehicleId);
        }

        return new LocalLockReleaser(localSemaphore);
    }

    private sealed class DistributedLockReleaser : IDisposable
    {
        private readonly IDatabase _db;
        private readonly string _key;
        private readonly string _val;
        private readonly SemaphoreSlim _semaphore;
        private readonly ILogger _logger;
        private bool _disposed;

        public DistributedLockReleaser(IDatabase db, string key, string val, SemaphoreSlim semaphore, ILogger logger)
        {
            _db = db;
            _key = key;
            _val = val;
            _semaphore = semaphore;
            _logger = logger;
        }

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;

            try
            {
                // Release Redis distributed lock via atomic Lua script
                _db.ScriptEvaluate(
                    ReleaseLockLuaScript,
                    keys: new RedisKey[] { _key },
                    values: new RedisValue[] { _val },
                    flags: CommandFlags.FireAndForget);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error releasing Redis distributed lock {Key}", _key);
            }
            finally
            {
                _semaphore.Release();
            }
        }
    }

    private sealed class LocalLockReleaser : IDisposable
    {
        private readonly SemaphoreSlim _semaphore;
        private bool _disposed;

        public LocalLockReleaser(SemaphoreSlim semaphore)
        {
            _semaphore = semaphore;
        }

        public void Dispose()
        {
            if (!_disposed)
            {
                _disposed = true;
                _semaphore.Release();
            }
        }
    }
}
