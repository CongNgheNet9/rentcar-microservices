using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.VehicleService.Data;
using RentCar.VehicleService.DTOs;

namespace RentCar.VehicleService.Controllers;

[ApiController]
[Route("api/vehicle-types")]
public class VehicleTypesController : ControllerBase
{
    private readonly VehicleDbContext _db;

    public VehicleTypesController(VehicleDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetActiveVehicleTypes()
    {
        var types = await _db.VehicleTypes
            .Where(t => t.IsActive)
            .OrderBy(t => t.Id)
            .Select(t => new VehicleTypeDto
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                IsActive = t.IsActive
            })
            .ToListAsync();

        return Ok(types);
    }
}
