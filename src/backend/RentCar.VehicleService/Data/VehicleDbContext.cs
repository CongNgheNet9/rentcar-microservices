using Microsoft.EntityFrameworkCore;
using RentCar.VehicleService.Entities;

namespace RentCar.VehicleService.Data;

public class VehicleDbContext : DbContext
{
    public VehicleDbContext(DbContextOptions<VehicleDbContext> options) : base(options)
    {
    }

    public DbSet<VehicleType> VehicleTypes => Set<VehicleType>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<VehicleType>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        modelBuilder.Entity<Location>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(150);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.LicensePlate).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Brand).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Model).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(30);
            entity.Property(e => e.PricePerDay).HasColumnType("decimal(18,2)");

            entity.HasIndex(e => e.LicensePlate).IsUnique();
            entity.HasIndex(e => e.VehicleTypeId);
            entity.HasIndex(e => e.LocationId);
            entity.HasIndex(e => new { e.IsActive, e.Status, e.VehicleTypeId, e.LocationId });

            entity.HasOne(e => e.VehicleType)
                .WithMany(t => t.Vehicles)
                .HasForeignKey(e => e.VehicleTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Location)
                .WithMany(l => l.Vehicles)
                .HasForeignKey(e => e.LocationId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Seed data
        var now = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);

        modelBuilder.Entity<VehicleType>().HasData(
            new VehicleType { Id = 1, Name = "Supercars", Description = "Exotic performance and prestige supercars", IsActive = true, CreatedAtUtc = now, UpdatedAtUtc = now },
            new VehicleType { Id = 2, Name = "SUVs", Description = "Full-size luxury and performance SUVs", IsActive = true, CreatedAtUtc = now, UpdatedAtUtc = now },
            new VehicleType { Id = 3, Name = "Sedans", Description = "Premium executive saloons", IsActive = true, CreatedAtUtc = now, UpdatedAtUtc = now },
            new VehicleType { Id = 4, Name = "Convertibles", Description = "Open-top grand tourers", IsActive = true, CreatedAtUtc = now, UpdatedAtUtc = now },
            new VehicleType { Id = 5, Name = "Electric", Description = "Modern electric vehicles", IsActive = true, CreatedAtUtc = now, UpdatedAtUtc = now }
        );

        modelBuilder.Entity<Location>().HasData(
            new Location { Id = 1, Name = "Los Angeles", Description = "LAX Airport & Beverly Hills Hub", IsActive = true, CreatedAtUtc = now, UpdatedAtUtc = now },
            new Location { Id = 2, Name = "Miami", Description = "South Beach Luxury Hub", IsActive = true, CreatedAtUtc = now, UpdatedAtUtc = now },
            new Location { Id = 3, Name = "New York", Description = "Manhattan Premier Executive Hub", IsActive = true, CreatedAtUtc = now, UpdatedAtUtc = now },
            new Location { Id = 4, Name = "Dubai", Description = "Downtown Dubai Luxury Showroom", IsActive = true, CreatedAtUtc = now, UpdatedAtUtc = now }
        );

        modelBuilder.Entity<Vehicle>().HasData(
            new Vehicle
            {
                Id = 1,
                VehicleTypeId = 1,
                LocationId = 1,
                LicensePlate = "DEMO-LMB01",
                Brand = "Lamborghini",
                Model = "Huracán Evo Spyder",
                Year = 2024,
                Status = "Available",
                IsActive = true,
                PricePerDay = 1299m,
                ImageUrl = "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80",
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new Vehicle
            {
                Id = 2,
                VehicleTypeId = 1,
                LocationId = 1,
                LicensePlate = "DEMO-FRR02",
                Brand = "Ferrari",
                Model = "SF90 Stradale",
                Year = 2024,
                Status = "Available",
                IsActive = true,
                PricePerDay = 1899m,
                ImageUrl = "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80",
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new Vehicle
            {
                Id = 3,
                VehicleTypeId = 2,
                LocationId = 1,
                LicensePlate = "DEMO-RR03",
                Brand = "Rolls-Royce",
                Model = "Cullinan Black Badge",
                Year = 2024,
                Status = "Available",
                IsActive = true,
                PricePerDay = 2199m,
                ImageUrl = "https://images.unsplash.com/photo-1631295868223-63265b40d9e4?auto=format&fit=crop&w=1200&q=80",
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new Vehicle
            {
                Id = 4,
                VehicleTypeId = 5,
                LocationId = 1,
                LicensePlate = "DEMO-VLV04",
                Brand = "Volvo",
                Model = "EX30 Ultra Twin Motor",
                Year = 2024,
                Status = "Available",
                IsActive = true,
                PricePerDay = 289m,
                ImageUrl = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new Vehicle
            {
                Id = 5,
                VehicleTypeId = 1,
                LocationId = 2,
                LicensePlate = "DEMO-POR05",
                Brand = "Porsche",
                Model = "911 GT3 RS",
                Year = 2024,
                Status = "Available",
                IsActive = true,
                PricePerDay = 999m,
                ImageUrl = "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80",
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new Vehicle
            {
                Id = 6,
                VehicleTypeId = 1,
                LocationId = 2,
                LicensePlate = "DEMO-MCL06",
                Brand = "McLaren",
                Model = "720S Spider",
                Year = 2023,
                Status = "Available",
                IsActive = true,
                PricePerDay = 1499m,
                ImageUrl = "https://images.unsplash.com/photo-1621135802920-133df287f89c?auto=format&fit=crop&w=1200&q=80",
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new Vehicle
            {
                Id = 7,
                VehicleTypeId = 4,
                LocationId = 3,
                LicensePlate = "DEMO-BNT07",
                Brand = "Bentley",
                Model = "Continental GT Speed",
                Year = 2024,
                Status = "Available",
                IsActive = true,
                PricePerDay = 1150m,
                ImageUrl = "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new Vehicle
            {
                Id = 8,
                VehicleTypeId = 2,
                LocationId = 3,
                LicensePlate = "DEMO-MBZ08",
                Brand = "Mercedes-AMG",
                Model = "G 63 Grand Edition",
                Year = 2024,
                Status = "Available",
                IsActive = true,
                PricePerDay = 1350m,
                ImageUrl = "https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&w=1200&q=80",
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new Vehicle
            {
                Id = 9,
                VehicleTypeId = 4,
                LocationId = 4,
                LicensePlate = "DEMO-AST09",
                Brand = "Aston Martin",
                Model = "DB11 V8 Volante",
                Year = 2023,
                Status = "Available",
                IsActive = true,
                PricePerDay = 1100m,
                ImageUrl = "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80",
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            }
        );
    }
}
