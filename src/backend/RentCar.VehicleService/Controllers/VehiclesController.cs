using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.Shared.Models;
using RentCar.VehicleService.Data;
using RentCar.VehicleService.DTOs;

namespace RentCar.VehicleService.Controllers;

[ApiController]
[Route("api/vehicles")]
public class VehiclesController : ControllerBase
{
    private readonly VehicleDbContext _db;

    public VehiclesController(VehicleDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetVehicles(
        [FromQuery] long? vehicleTypeId,
        [FromQuery] long? locationId,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20;

        // Active, available catalog only
        var query = _db.Vehicles
            .Include(v => v.VehicleType)
            .Include(v => v.Location)
            .Where(v => v.IsActive && v.Status == "Available" && v.VehicleType.IsActive && v.Location.IsActive);

        if (vehicleTypeId.HasValue)
        {
            query = query.Where(v => v.VehicleTypeId == vehicleTypeId.Value);
        }

        if (locationId.HasValue)
        {
            query = query.Where(v => v.LocationId == locationId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(v => v.Brand.ToLower().Contains(s) || v.Model.ToLower().Contains(s) || v.LicensePlate.ToLower().Contains(s));
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(v => v.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(v => new VehicleDto
            {
                Id = v.Id,
                VehicleTypeId = v.VehicleTypeId,
                VehicleTypeName = v.VehicleType.Name,
                LocationId = v.LocationId,
                LocationName = v.Location.Name,
                LicensePlate = v.LicensePlate,
                Brand = v.Brand,
                Model = v.Model,
                Year = v.Year,
                Status = v.Status,
                IsActive = v.IsActive,
                ImageUrl = v.ImageUrl,
                PricePerDay = v.PricePerDay
            })
            .ToListAsync();

        return Ok(new PagedResponse<VehicleDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpGet("{vehicleId}")]
    public async Task<IActionResult> GetVehicleById(long vehicleId)
    {
        var v = await _db.Vehicles
            .Include(v => v.VehicleType)
            .Include(v => v.Location)
            .FirstOrDefaultAsync(v => v.Id == vehicleId && v.IsActive);

        if (v == null)
        {
            return NotFound(ApiProblemDetails.Create(
                404,
                "vehicle.not_found",
                "Vehicle Not Found",
                $"Vehicle with ID {vehicleId} was not found.",
                Request.Path
            ));
        }

        return Ok(new VehicleDto
        {
            Id = v.Id,
            VehicleTypeId = v.VehicleTypeId,
            VehicleTypeName = v.VehicleType.Name,
            LocationId = v.LocationId,
            LocationName = v.Location.Name,
            LicensePlate = v.LicensePlate,
            Brand = v.Brand,
            Model = v.Model,
            Year = v.Year,
            Status = v.Status,
            IsActive = v.IsActive,
            ImageUrl = v.ImageUrl,
            PricePerDay = v.PricePerDay
        });
    }
}
