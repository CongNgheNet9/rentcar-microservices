var builder = WebApplication.CreateBuilder(args);

// Add YARP
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

// Add CORS
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

app.UseCors();

// Map health check
app.MapGet("/health", () => Results.Ok(new
{
    status = "Healthy",
    service = "RentCar API Gateway (YARP)",
    timestampUtc = DateTime.UtcNow
}));

app.MapReverseProxy();

app.Run();
