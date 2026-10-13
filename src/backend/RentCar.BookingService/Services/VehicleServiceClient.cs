using System.Net.Http.Json;
using RentCar.BookingService.DTOs;

namespace RentCar.BookingService.Services;

public class VehicleServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<VehicleServiceClient> _logger;

    public VehicleServiceClient(HttpClient httpClient, ILogger<VehicleServiceClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<VehicleEligibilityResponse?> CheckEligibilityAsync(long vehicleId)
    {
        try
        {
            var response = await _httpClient.GetAsync($"api/internal/vehicles/{vehicleId}/eligibility");
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("VehicleService returned status code {StatusCode} for vehicle {VehicleId}", response.StatusCode, vehicleId);
                return null;
            }

            return await response.Content.ReadFromJsonAsync<VehicleEligibilityResponse>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to call VehicleService for vehicle {VehicleId}", vehicleId);
            return null;
        }
    }
}
