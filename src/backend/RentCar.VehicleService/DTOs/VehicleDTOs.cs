using System.ComponentModel.DataAnnotations;

namespace RentCar.VehicleService.DTOs;

public class VehicleDto
{
    public long Id { get; set; }
    public long VehicleTypeId { get; set; }
    public string VehicleTypeName { get; set; } = string.Empty;
    public long LocationId { get; set; }
    public string LocationName { get; set; } = string.Empty;
    public string LicensePlate { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string? ImageUrl { get; set; }
    public decimal PricePerDay { get; set; }
}

public class VehicleTypeDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}

public class LocationDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}

public class CreateVehicleRequest
{
    [Required]
    public long VehicleTypeId { get; set; }

    [Required]
    public long LocationId { get; set; }

    [Required]
    [StringLength(50)]
    public string LicensePlate { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Brand { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Model { get; set; } = string.Empty;

    [Range(1900, 2100)]
    public int Year { get; set; }

    public string? ImageUrl { get; set; }

    [Range(1, 100000)]
    public decimal PricePerDay { get; set; } = 299m;
}

public class UpdateVehicleRequest
{
    public long? VehicleTypeId { get; set; }
    public long? LocationId { get; set; }
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public int? Year { get; set; }
    public string? Status { get; set; }
    public string? ImageUrl { get; set; }
    public decimal? PricePerDay { get; set; }
}

public class CreateVehicleTypeRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }
}

public class UpdateVehicleTypeRequest
{
    [StringLength(100)]
    public string? Name { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }
}

public class CreateLocationRequest
{
    [Required]
    [StringLength(150)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }
}

public class UpdateLocationRequest
{
    [StringLength(150)]
    public string? Name { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }
}

public class VehicleEligibilityDto
{
    public long VehicleId { get; set; }
    public bool IsEligible { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public decimal PricePerDay { get; set; }
    public string? IneligibleReason { get; set; }
}

public class PagedResponse<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
