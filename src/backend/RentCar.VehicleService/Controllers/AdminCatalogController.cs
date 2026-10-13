using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.Shared.Constants;
using RentCar.Shared.Models;
using RentCar.VehicleService.Data;
using RentCar.VehicleService.DTOs;
using RentCar.VehicleService.Entities;

namespace RentCar.VehicleService.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = UserRoles.Admin)]
public class AdminCatalogController : ControllerBase
{
    private readonly VehicleDbContext _db;

    public AdminCatalogController(VehicleDbContext db)
    {
        _db = db;
    }

    #region Vehicles

    [HttpGet("vehicles")]
    public async Task<IActionResult> GetAllVehicles(
        [FromQuery] long? vehicleTypeId,
        [FromQuery] long? locationId,
        [FromQuery] string? status,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var query = _db.Vehicles
            .Include(v => v.VehicleType)
            .Include(v => v.Location)
            .AsQueryable();

        if (vehicleTypeId.HasValue) query = query.Where(v => v.VehicleTypeId == vehicleTypeId.Value);
        if (locationId.HasValue) query = query.Where(v => v.LocationId == locationId.Value);
        if (!string.IsNullOrEmpty(status)) query = query.Where(v => v.Status == status);
        if (isActive.HasValue) query = query.Where(v => v.IsActive == isActive.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(v => v.Id)
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

    [HttpGet("vehicles/{vehicleId}")]
    public async Task<IActionResult> GetAdminVehicle(long vehicleId)
    {
        var v = await _db.Vehicles
            .Include(v => v.VehicleType)
            .Include(v => v.Location)
            .FirstOrDefaultAsync(v => v.Id == vehicleId);

        if (v == null)
        {
            return NotFound(ApiProblemDetails.Create(
                404,
                "vehicle.not_found",
                "Vehicle Not Found",
                $"Vehicle {vehicleId} not found.",
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

    [HttpPost("vehicles")]
    public async Task<IActionResult> CreateVehicle([FromBody] CreateVehicleRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiProblemDetails.Create(
                400,
                "request.invalid",
                "Validation Error",
                "Invalid vehicle creation payload.",
                Request.Path
            ));
        }

        // Verify type and location
        var typeExists = await _db.VehicleTypes.AnyAsync(t => t.Id == request.VehicleTypeId && t.IsActive);
        if (!typeExists)
        {
            return BadRequest(ApiProblemDetails.Create(
                400,
                "vehicle.type_invalid",
                "Invalid Vehicle Type",
                "Selected vehicle type does not exist or is inactive.",
                Request.Path
            ));
        }

        var locExists = await _db.Locations.AnyAsync(l => l.Id == request.LocationId && l.IsActive);
        if (!locExists)
        {
            return BadRequest(ApiProblemDetails.Create(
                400,
                "vehicle.location_invalid",
                "Invalid Location",
                "Selected location does not exist or is inactive.",
                Request.Path
            ));
        }

        var plateExists = await _db.Vehicles.AnyAsync(v => v.LicensePlate.ToLower() == request.LicensePlate.Trim().ToLower());
        if (plateExists)
        {
            return Conflict(ApiProblemDetails.Create(
                409,
                "vehicle.plate_conflict",
                "Duplicate License Plate",
                "A vehicle with this license plate already exists.",
                Request.Path
            ));
        }

        var vehicle = new Vehicle
        {
            VehicleTypeId = request.VehicleTypeId,
            LocationId = request.LocationId,
            LicensePlate = request.LicensePlate.Trim().ToUpperInvariant(),
            Brand = request.Brand.Trim(),
            Model = request.Model.Trim(),
            Year = request.Year,
            Status = "Available",
            IsActive = true,
            ImageUrl = request.ImageUrl,
            PricePerDay = request.PricePerDay,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow
        };

        _db.Vehicles.Add(vehicle);
        await _db.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, vehicle);
    }

    [HttpPut("vehicles/{vehicleId}")]
    public async Task<IActionResult> UpdateVehicle(long vehicleId, [FromBody] UpdateVehicleRequest request)
    {
        var v = await _db.Vehicles.FirstOrDefaultAsync(x => x.Id == vehicleId);
        if (v == null)
        {
            return NotFound(ApiProblemDetails.Create(404, "vehicle.not_found", "Not Found", "Vehicle not found."));
        }

        if (request.VehicleTypeId.HasValue) v.VehicleTypeId = request.VehicleTypeId.Value;
        if (request.LocationId.HasValue) v.LocationId = request.LocationId.Value;
        if (!string.IsNullOrEmpty(request.Brand)) v.Brand = request.Brand.Trim();
        if (!string.IsNullOrEmpty(request.Model)) v.Model = request.Model.Trim();
        if (request.Year.HasValue) v.Year = request.Year.Value;
        if (!string.IsNullOrEmpty(request.Status)) v.Status = request.Status;
        if (request.ImageUrl != null) v.ImageUrl = request.ImageUrl;
        if (request.PricePerDay.HasValue) v.PricePerDay = request.PricePerDay.Value;
        v.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(v);
    }

    [HttpPatch("vehicles/{vehicleId}/deactivate")]
    public async Task<IActionResult> DeactivateVehicle(long vehicleId)
    {
        var v = await _db.Vehicles.FirstOrDefaultAsync(x => x.Id == vehicleId);
        if (v == null)
        {
            return NotFound(ApiProblemDetails.Create(404, "vehicle.not_found", "Not Found", "Vehicle not found."));
        }

        v.IsActive = false;
        v.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    #endregion

    #region Vehicle Types

    [HttpGet("vehicle-types")]
    public async Task<IActionResult> GetAllVehicleTypes()
    {
        var types = await _db.VehicleTypes
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

    [HttpPost("vehicle-types")]
    public async Task<IActionResult> CreateVehicleType([FromBody] CreateVehicleTypeRequest request)
    {
        var type = new VehicleType
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            IsActive = true,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow
        };
        _db.VehicleTypes.Add(type);
        await _db.SaveChangesAsync();
        return StatusCode(StatusCodes.Status201Created, type);
    }

    [HttpPut("vehicle-types/{typeId}")]
    public async Task<IActionResult> UpdateVehicleType(long typeId, [FromBody] UpdateVehicleTypeRequest request)
    {
        var t = await _db.VehicleTypes.FirstOrDefaultAsync(x => x.Id == typeId);
        if (t == null) return NotFound();
        if (!string.IsNullOrEmpty(request.Name)) t.Name = request.Name.Trim();
        if (request.Description != null) t.Description = request.Description.Trim();
        t.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(t);
    }

    [HttpPatch("vehicle-types/{typeId}/deactivate")]
    public async Task<IActionResult> DeactivateVehicleType(long typeId)
    {
        var t = await _db.VehicleTypes.FirstOrDefaultAsync(x => x.Id == typeId);
        if (t == null) return NotFound();
        t.IsActive = false;
        t.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    #endregion

    #region Locations

    [HttpGet("locations")]
    public async Task<IActionResult> GetAllLocations()
    {
        var locs = await _db.Locations
            .OrderBy(l => l.Id)
            .Select(l => new LocationDto
            {
                Id = l.Id,
                Name = l.Name,
                Description = l.Description,
                IsActive = l.IsActive
            })
            .ToListAsync();
        return Ok(locs);
    }

    [HttpPost("locations")]
    public async Task<IActionResult> CreateLocation([FromBody] CreateLocationRequest request)
    {
        var loc = new Location
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            IsActive = true,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow
        };
        _db.Locations.Add(loc);
        await _db.SaveChangesAsync();
        return StatusCode(StatusCodes.Status201Created, loc);
    }

    [HttpPut("locations/{locationId}")]
    public async Task<IActionResult> UpdateLocation(long locationId, [FromBody] UpdateLocationRequest request)
    {
        var l = await _db.Locations.FirstOrDefaultAsync(x => x.Id == locationId);
        if (l == null) return NotFound();
        if (!string.IsNullOrEmpty(request.Name)) l.Name = request.Name.Trim();
        if (request.Description != null) l.Description = request.Description.Trim();
        l.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(l);
    }

    [HttpPatch("locations/{locationId}/deactivate")]
    public async Task<IActionResult> DeactivateLocation(long locationId)
    {
        var l = await _db.Locations.FirstOrDefaultAsync(x => x.Id == locationId);
        if (l == null) return NotFound();
        l.IsActive = false;
        l.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    #endregion
}
