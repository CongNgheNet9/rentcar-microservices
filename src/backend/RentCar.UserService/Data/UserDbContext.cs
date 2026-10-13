using Microsoft.EntityFrameworkCore;
using RentCar.Shared.Constants;
using RentCar.UserService.Entities;

namespace RentCar.UserService.Data;

public class UserDbContext : DbContext
{
    public UserDbContext(DbContextOptions<UserDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<EmailVerification> EmailVerifications => Set<EmailVerification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId);

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(320);

            entity.Property(e => e.PasswordHash)
                .IsRequired()
                .HasMaxLength(512);

            entity.Property(e => e.Role)
                .IsRequired()
                .HasMaxLength(30);

            entity.Property(e => e.Status)
                .IsRequired()
                .HasMaxLength(30);

            entity.Property(e => e.CreatedAtUtc).IsRequired();
            entity.Property(e => e.UpdatedAtUtc).IsRequired();

            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => new { e.Role, e.Status });
            entity.HasIndex(e => e.DeletedAtUtc);

            entity.HasQueryFilter(e => e.DeletedAtUtc == null);
        });

        modelBuilder.Entity<EmailVerification>(entity =>
        {
            entity.HasKey(e => e.EmailVerificationId);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(320);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Purpose).IsRequired().HasMaxLength(50);
            entity.Property(e => e.IsUsed).IsRequired();
            entity.Property(e => e.CreatedAtUtc).IsRequired();
            entity.Property(e => e.ExpiresAtUtc).IsRequired();

            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => e.Code);
            entity.HasIndex(e => e.ExpiresAtUtc);
        });

        // Seed initial accounts
        var adminId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var customerId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        // "Admin@123" hashed with BCrypt
        var adminPasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123");
        // "Customer@123" hashed with BCrypt
        var customerPasswordHash = BCrypt.Net.BCrypt.HashPassword("Customer@123");

        modelBuilder.Entity<User>().HasData(
            new User
            {
                UserId = adminId,
                Name = "System Administrator",
                Email = "admin@rentcar.com",
                PasswordHash = adminPasswordHash,
                Role = UserRoles.Admin,
                Status = "Active",
                CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                UserId = customerId,
                Name = "John Customer",
                Email = "customer@rentcar.com",
                PasswordHash = customerPasswordHash,
                Role = UserRoles.Customer,
                Status = "Active",
                CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );
    }
}
