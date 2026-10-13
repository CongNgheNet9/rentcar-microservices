using Microsoft.EntityFrameworkCore;
using RentCar.BookingService.Entities;

namespace RentCar.BookingService.Data;

public class BookingDbContext : DbContext
{
    public BookingDbContext(DbContextOptions<BookingDbContext> options) : base(options)
    {
    }

    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<BookingStatusHistory> BookingStatusHistories => Set<BookingStatusHistory>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<IdempotencyRecord> IdempotencyRecords => Set<IdempotencyRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasKey(e => e.BookingId);
            entity.Property(e => e.CustomerUserId).IsRequired();
            entity.Property(e => e.VehicleId).IsRequired();
            entity.Property(e => e.PickupLocationId).IsRequired();
            entity.Property(e => e.ReturnLocationId).IsRequired();
            entity.Property(e => e.PickupUtc).IsRequired();
            entity.Property(e => e.ReturnUtc).IsRequired();
            entity.Property(e => e.Status).IsRequired().HasMaxLength(30);
            entity.Property(e => e.TotalPrice).HasColumnType("decimal(18,2)");
            
            if (Database.IsSqlServer())
            {
                entity.Property(e => e.RowVersion).IsRowVersion();
            }
            else
            {
                entity.Property(e => e.RowVersion)
                    .IsConcurrencyToken()
                    .HasDefaultValueSql("randomblob(8)");
            }

            entity.HasIndex(e => e.CustomerUserId);
            entity.HasIndex(e => new { e.VehicleId, e.Status });
            entity.HasIndex(e => new { e.VehicleId, e.Status, e.PickupUtc, e.ReturnUtc });
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAtUtc);
            entity.HasIndex(e => e.DeletedAtUtc);

            entity.HasQueryFilter(e => e.DeletedAtUtc == null);
        });

        modelBuilder.Entity<BookingStatusHistory>(entity =>
        {
            entity.HasKey(e => e.BookingStatusHistoryId);
            entity.Property(e => e.NewStatus).IsRequired().HasMaxLength(30);
            entity.Property(e => e.PreviousStatus).HasMaxLength(30);
            entity.Property(e => e.Reason).HasMaxLength(500);

            entity.HasIndex(e => e.BookingId);
            entity.HasIndex(e => e.ChangedAtUtc);

            entity.HasOne(e => e.Booking)
                .WithMany(b => b.StatusHistory)
                .HasForeignKey(e => e.BookingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.PaymentId);
            entity.Property(e => e.Amount).HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(e => e.Currency).IsRequired().HasMaxLength(10);
            entity.Property(e => e.PaymentMethod).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(30);
            entity.Property(e => e.TransactionReference).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CardLast4).HasMaxLength(4);
            entity.Property(e => e.CardBrand).HasMaxLength(30);
            entity.Property(e => e.PayerName).HasMaxLength(150);
            entity.Property(e => e.BankCode).HasMaxLength(50);
            entity.Property(e => e.Note).HasMaxLength(500);

            entity.HasIndex(e => e.BookingId);
            entity.HasIndex(e => e.CustomerUserId);
            entity.HasIndex(e => e.TransactionReference).IsUnique();
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.PaidAtUtc);

            entity.HasOne(e => e.Booking)
                .WithMany(b => b.Payments)
                .HasForeignKey(e => e.BookingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IdempotencyRecord>(entity =>
        {
            entity.HasKey(e => new { e.CustomerUserId, e.IdempotencyKey });
            entity.Property(e => e.IdempotencyKey).HasMaxLength(128);
            entity.Property(e => e.RequestHash).IsRequired().HasMaxLength(32);
            entity.Property(e => e.ResponseBody).IsRequired();
        });
    }
}
