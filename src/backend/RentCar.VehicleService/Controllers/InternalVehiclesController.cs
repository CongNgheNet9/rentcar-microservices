using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.VehicleService.Data;
using RentCar.VehicleService.DTOs;

namespace RentCar.VehicleService.Controllers;

[ApiController]
[Route("api/internal/vehicles")]
public class InternalVehiclesController : ControllerBase
{
    private readonly VehicleDbContext _db;

    public InternalVehiclesController(VehicleDbContext db)
    {
        _db = db;
    }

    [HttpGet("{vehicleId}/eligibility")]
    public async Task<IActionResult> CheckEligibility(long vehicleId)
    {
        var v = await _db.Vehicles
            .Include(v => v.VehicleType)
            .Include(v => v.Location)
            .FirstOrDefaultAsync(v => v.Id == vehicleId);

        if (v == null)
        {
            return Ok(new VehicleEligibilityDto
            {
                VehicleId = vehicleId,
                IsEligible = false,
                IneligibleReason = "Vehicle does not exist."
            });
        }

        if (!v.IsActive)
        {
            return Ok(new VehicleEligibilityDto
            {
                VehicleId = vehicleId,
                IsEligible = false,
                IsActive = false,
                Status = v.Status,
                Brand = v.Brand,
                Model = v.Model,
                IneligibleReason = "Vehicle is inactive."
            });
        }

        if (v.Status != "Available")
        {
            return Ok(new VehicleEligibilityDto
            {
                VehicleId = vehicleId,
                IsEligible = false,
                IsActive = true,
                Status = v.Status,
                Brand = v.Brand,
                Model = v.Model,
                IneligibleReason = $"Vehicle operational status is '{v.Status}', not 'Available'."
            });
        }

        if (!v.VehicleType.IsActive || !v.Location.IsActive)
        {
            return Ok(new VehicleEligibilityDto
            {
                VehicleId = vehicleId,
                IsEligible = false,
                IsActive = true,
                Status = v.Status,
                Brand = v.Brand,
                Model = v.Model,
                IneligibleReason = "Vehicle type or location is inactive."
            });
        }

        return Ok(new VehicleEligibilityDto
        {
            VehicleId = vehicleId,
            IsEligible = true,
            IsActive = true,
            Status = v.Status,
            Brand = v.Brand,
            Model = v.Model,
            PricePerDay = v.PricePerDay
        });
    }
}
