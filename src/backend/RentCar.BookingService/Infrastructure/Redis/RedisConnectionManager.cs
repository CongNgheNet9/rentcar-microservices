using StackExchange.Redis;

namespace RentCar.BookingService.Infrastructure.Redis;

public interface IRedisConnectionManager
{
    IDatabase? GetMasterDatabase(long? vehicleId = null);
    IDatabase? GetReplicaDatabase(long? vehicleId = null);
    bool IsConnected { get; }
    int ShardCount { get; }
}

public class RedisConnectionManager : IRedisConnectionManager, IDisposable
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<RedisConnectionManager> _logger;

    private IConnectionMultiplexer? _masterMultiplexer;
    private IConnectionMultiplexer? _replicaMultiplexer;
    private readonly List<IConnectionMultiplexer> _shardMultiplexers = new();
    private readonly object _lock = new();
    private bool _initialized;

    public RedisConnectionManager(
        IConfiguration configuration,
        ILogger<RedisConnectionManager> logger)
    {
        _configuration = configuration;
        _logger = logger;
        InitializeConnections();
    }

    private void InitializeConnections()
    {
        lock (_lock)
        {
            if (_initialized) return;

            try
            {
                var masterConnStr = _configuration.GetConnectionString("Redis") 
                    ?? _configuration["Redis:Master"] 
                    ?? "127.0.0.1:6379";

                var masterConfig = ConfigurationOptions.Parse(masterConnStr);
                masterConfig.AbortOnConnectFail = false;
                masterConfig.ConnectTimeout = 3000;
                masterConfig.SyncTimeout = 3000;
                masterConfig.ClientName = "RentCar.BookingService.Master";

                _masterMultiplexer = ConnectionMultiplexer.Connect(masterConfig);
                _logger.LogInformation("Connected to Redis Master at {Endpoints}", string.Join(",", _masterMultiplexer.GetEndPoints().Select(e => e.ToString())));

                // Replica configuration (Read Replica)
                var replicaConnStr = _configuration.GetConnectionString("RedisReplica")
                    ?? _configuration["Redis:Replica"];

                if (!string.IsNullOrWhiteSpace(replicaConnStr))
                {
                    var replicaConfig = ConfigurationOptions.Parse(replicaConnStr);
                    replicaConfig.AbortOnConnectFail = false;
                    replicaConfig.ConnectTimeout = 3000;
                    replicaConfig.SyncTimeout = 3000;
                    replicaConfig.ClientName = "RentCar.BookingService.Replica";
                    _replicaMultiplexer = ConnectionMultiplexer.Connect(replicaConfig);
                    _logger.LogInformation("Connected to Redis Replica at {Endpoints}", string.Join(",", _replicaMultiplexer.GetEndPoints().Select(e => e.ToString())));
                }

                // Shards configuration (Horizontal sharding by vehicle)
                var shardNodes = _configuration.GetSection("Redis:Shards").Get<string[]>();
                if (shardNodes != null && shardNodes.Length > 0)
                {
                    foreach (var shardNode in shardNodes)
                    {
                        try
                        {
                            var shardConfig = ConfigurationOptions.Parse(shardNode);
                            shardConfig.AbortOnConnectFail = false;
                            shardConfig.ConnectTimeout = 3000;
                            var mux = ConnectionMultiplexer.Connect(shardConfig);
                            _shardMultiplexers.Add(mux);
                            _logger.LogInformation("Registered Redis Shard at {Endpoints}", string.Join(",", mux.GetEndPoints().Select(e => e.ToString())));
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Could not initialize Redis shard node at {ShardNode}", shardNode);
                        }
                    }
                }

                _initialized = true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to initialize Redis connection. Distributed locks and cache will fall back gracefully.");
            }
        }
    }

    public bool IsConnected => _masterMultiplexer != null && _masterMultiplexer.IsConnected;

    public int ShardCount => _shardMultiplexers.Count > 0 ? _shardMultiplexers.Count : 1;

    public IDatabase? GetMasterDatabase(long? vehicleId = null)
    {
        if (!IsConnected) return null;

        // Route by vehicleId across shards if sharding is configured
        if (vehicleId.HasValue && _shardMultiplexers.Count > 1)
        {
            var shardIndex = (int)(Math.Abs(vehicleId.Value) % _shardMultiplexers.Count);
            var shard = _shardMultiplexers[shardIndex];
            if (shard.IsConnected)
            {
                return shard.GetDatabase();
            }
        }

        return _masterMultiplexer?.GetDatabase();
    }

    public IDatabase? GetReplicaDatabase(long? vehicleId = null)
    {
        // First priority: Read replica if connected
        if (_replicaMultiplexer != null && _replicaMultiplexer.IsConnected)
        {
            return _replicaMultiplexer.GetDatabase();
        }

        // Fallback: Read from master / shard
        return GetMasterDatabase(vehicleId);
    }

    public void Dispose()
    {
        _masterMultiplexer?.Dispose();
        _replicaMultiplexer?.Dispose();
        foreach (var shard in _shardMultiplexers)
        {
            shard.Dispose();
        }
    }
}
