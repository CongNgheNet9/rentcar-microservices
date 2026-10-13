using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using RentCar.BookingService.Data;
using RentCar.BookingService.Infrastructure.Redis;
using RentCar.BookingService.Infrastructure.Sharding;
using RentCar.BookingService.Services;
using RentCar.Shared.Security;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "RentCar Booking Service API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var jwtSettings = new JwtSettings();
builder.Configuration.GetSection(JwtSettings.SectionName).Bind(jwtSettings);
builder.Services.AddSingleton(jwtSettings);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtSettings.Audience,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=bookings.db";
builder.Services.AddDbContext<BookingDbContext>(options =>
{
    if (connectionString.Contains(".db", StringComparison.OrdinalIgnoreCase))
    {
        options.UseSqlite(connectionString);
    }
    else
    {
        options.UseSqlServer(connectionString);
    }
});

// Register VehicleServiceClient
var vehicleServiceBase = builder.Configuration["Services:VehicleService"] ?? "http://localhost:5002/";
builder.Services.AddHttpClient<VehicleServiceClient>(client =>
{
    client.BaseAddress = new Uri(vehicleServiceBase);
    client.Timeout = TimeSpan.FromSeconds(5);
});

// Register Redis Master-Replica & Shard Connection Manager
builder.Services.AddSingleton<IRedisConnectionManager, RedisConnectionManager>();

// Register Distributed Lock Manager (Redis SET NX PX with Lua script + in-memory fallback)
builder.Services.AddSingleton<IBookingLockManager, RedisBookingLockManager>();
builder.Services.AddSingleton<BookingLockManager>();

// Register Distributed Idempotency Service (Redis 24h TTL + DB persistent record)
builder.Services.AddSingleton<IRedisIdempotencyService, RedisIdempotencyService>();

// Register Database Shard Resolver (Horizontal sharding by VehicleId)
builder.Services.AddSingleton<IDbShardResolver, DbShardResolver>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
    db.Database.EnsureCreated();

    // Ensure database shards exist for VehicleId horizontal sharding
    var shardResolver = scope.ServiceProvider.GetRequiredService<IDbShardResolver>();
    foreach (var shardConn in shardResolver.GetAllShardConnectionStrings())
    {
        try
        {
            var shardOptions = new DbContextOptionsBuilder<BookingDbContext>()
                .UseSqlite(shardConn)
                .Options;
            using var shardDb = new BookingDbContext(shardOptions);
            shardDb.Database.EnsureCreated();
        }
        catch { }
    }

    // Ensure Payments table exists for existing databases
    try
    {
        db.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS ""Payments"" (
                ""PaymentId"" TEXT NOT NULL CONSTRAINT ""PK_Payments"" PRIMARY KEY,
                ""BookingId"" TEXT NOT NULL,
                ""CustomerUserId"" TEXT NOT NULL,
                ""Amount"" TEXT NOT NULL,
                ""Currency"" TEXT NOT NULL,
                ""PaymentMethod"" TEXT NOT NULL,
                ""Status"" TEXT NOT NULL,
                ""TransactionReference"" TEXT NOT NULL,
                ""CardLast4"" TEXT NULL,
                ""CardBrand"" TEXT NULL,
                ""PayerName"" TEXT NULL,
                ""BankCode"" TEXT NULL,
                ""Note"" TEXT NULL,
                ""PaidAtUtc"" TEXT NOT NULL,
                ""CreatedAtUtc"" TEXT NOT NULL,
                CONSTRAINT ""FK_Payments_Bookings_BookingId"" FOREIGN KEY (""BookingId"") REFERENCES ""Bookings"" (""BookingId"") ON DELETE CASCADE
            );
            CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Payments_TransactionReference"" ON ""Payments"" (""TransactionReference"");
            CREATE INDEX IF NOT EXISTS ""IX_Payments_BookingId"" ON ""Payments"" (""BookingId"");
            CREATE INDEX IF NOT EXISTS ""IX_Payments_CustomerUserId"" ON ""Payments"" (""CustomerUserId"");
            CREATE INDEX IF NOT EXISTS ""IX_Payments_Status"" ON ""Payments"" (""Status"");
        ");
    }
    catch { }
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
