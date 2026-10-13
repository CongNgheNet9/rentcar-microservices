using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.VehicleService.Data;
using RentCar.VehicleService.DTOs;

namespace RentCar.VehicleService.Controllers;

[ApiController]
[Route("api/locations")]
public class LocationsController : ControllerBase
{
    private readonly VehicleDbContext _db;

    public LocationsController(VehicleDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetActiveLocations()
    {
        var locations = await _db.Locations
            .Where(l => l.IsActive)
            .OrderBy(l => l.Id)
            .Select(l => new LocationDto
            {
                Id = l.Id,
                Name = l.Name,
                Description = l.Description,
                IsActive = l.IsActive
            })
            .ToListAsync();

        return Ok(locations);
    }
}
