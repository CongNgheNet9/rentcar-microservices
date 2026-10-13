using Microsoft.EntityFrameworkCore;
using RentCar.BookingService.Data;

namespace RentCar.BookingService.Infrastructure.Sharding;

public interface IDbShardResolver
{
    int ShardCount { get; }
    int ResolveShardIndex(long vehicleId);
    string GetShardConnectionString(long vehicleId, bool readOnly = false);
    string GetMasterConnectionString();
    string GetReplicaConnectionString();
    IReadOnlyList<string> GetAllShardConnectionStrings();
}

public class DbShardResolver : IDbShardResolver
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<DbShardResolver> _logger;
    private readonly List<string> _shardConnectionStrings = new();
    private readonly string _masterConnectionString;
    private readonly string _replicaConnectionString;

    public DbShardResolver(IConfiguration configuration, ILogger<DbShardResolver> logger)
    {
        _configuration = configuration;
        _logger = logger;

        _masterConnectionString = _configuration.GetConnectionString("DefaultConnection") 
            ?? "Data Source=bookings.db";

        _replicaConnectionString = _configuration.GetConnectionString("ReadOnlyReplica") 
            ?? _masterConnectionString;

        // Load explicit shards if configured
        var configuredShards = _configuration.GetSection("ConnectionStrings:Shards").Get<string[]>();
        if (configuredShards != null && configuredShards.Length > 0)
        {
            _shardConnectionStrings.AddRange(configuredShards);
        }
        else
        {
            // Default 2 virtual horizontal shards for development based on vehicleId
            _shardConnectionStrings.Add("Data Source=bookings_shard_0.db");
            _shardConnectionStrings.Add("Data Source=bookings_shard_1.db");
        }

        _logger.LogInformation("DbShardResolver initialized with {ShardCount} shards. Shard key: VehicleId.", ShardCount);
    }

    public int ShardCount => _shardConnectionStrings.Count;

    public int ResolveShardIndex(long vehicleId)
    {
        return (int)(Math.Abs(vehicleId) % ShardCount);
    }

    public string GetShardConnectionString(long vehicleId, bool readOnly = false)
    {
        if (readOnly && !string.IsNullOrWhiteSpace(_replicaConnectionString) && _replicaConnectionString != _masterConnectionString)
        {
            return _replicaConnectionString;
        }

        var index = ResolveShardIndex(vehicleId);
        return _shardConnectionStrings[index];
    }

    public string GetMasterConnectionString() => _masterConnectionString;

    public string GetReplicaConnectionString() => _replicaConnectionString;

    public IReadOnlyList<string> GetAllShardConnectionStrings() => _shardConnectionStrings.AsReadOnly();
}
