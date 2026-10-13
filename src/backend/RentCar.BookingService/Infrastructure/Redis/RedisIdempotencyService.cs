using System.Text.Json;
using StackExchange.Redis;

namespace RentCar.BookingService.Infrastructure.Redis;

public class CachedIdempotencyRecord
{
    public string RequestHashBase64 { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public string ResponseBody { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
}

public interface IRedisIdempotencyService
{
    Task<CachedIdempotencyRecord?> GetRecordAsync(Guid userId, string idempotencyKey);
    Task SetRecordAsync(Guid userId, string idempotencyKey, byte[] requestHash, int statusCode, string responseBody, TimeSpan? ttl = null);
}

public class RedisIdempotencyService : IRedisIdempotencyService
{
    private readonly IRedisConnectionManager _redis;
    private readonly ILogger<RedisIdempotencyService> _logger;
    private static readonly TimeSpan DefaultTtl = TimeSpan.FromHours(24);

    public RedisIdempotencyService(
        IRedisConnectionManager redis,
        ILogger<RedisIdempotencyService> logger)
    {
        _redis = redis;
        _logger = logger;
    }

    private static string GetCacheKey(Guid userId, string idempotencyKey) =>
        $"idempotency:{userId:N}:{idempotencyKey.Trim()}";

    public async Task<CachedIdempotencyRecord?> GetRecordAsync(Guid userId, string idempotencyKey)
    {
        try
        {
            // Read from Replica database to distribute read workload
            var db = _redis.GetReplicaDatabase();
            if (db == null) return null;

            var key = GetCacheKey(userId, idempotencyKey);
            var value = await db.StringGetAsync(key);

            if (value.IsNullOrEmpty) return null;

            var record = JsonSerializer.Deserialize<CachedIdempotencyRecord>(value.ToString());
            return record;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to read idempotency key {Key} from Redis cache. Falling back to DB.", idempotencyKey);
            return null;
        }
    }

    public async Task SetRecordAsync(
        Guid userId,
        string idempotencyKey,
        byte[] requestHash,
        int statusCode,
        string responseBody,
        TimeSpan? ttl = null)
    {
        try
        {
            // Write to Master database with 24-hour expiration
            var db = _redis.GetMasterDatabase();
            if (db == null) return;

            var key = GetCacheKey(userId, idempotencyKey);
            var record = new CachedIdempotencyRecord
            {
                RequestHashBase64 = Convert.ToBase64String(requestHash),
                StatusCode = statusCode,
                ResponseBody = responseBody,
                CreatedAtUtc = DateTime.UtcNow
            };

            var json = JsonSerializer.Serialize(record);
            await db.StringSetAsync(key, json, ttl ?? DefaultTtl);
            _logger.LogDebug("Cached idempotency key {Key} in Redis with 24h TTL", key);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to write idempotency key {Key} to Redis cache.", idempotencyKey);
        }
    }
}
