using Microsoft.EntityFrameworkCore;
using ShippingAPI.Models;

namespace ShippingAPI.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<Withdrawal> Withdrawals => Set<Withdrawal>();
    public DbSet<FuelClaim> FuelClaims => Set<FuelClaim>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Username).IsUnique();
            entity.Property(u => u.Username).IsRequired().HasMaxLength(50);
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.Property(u => u.FullName).IsRequired().HasMaxLength(100);
            entity.Property(u => u.Role).HasConversion<int>();
        });

        // Shipment
        modelBuilder.Entity<Shipment>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.HasIndex(s => s.TripNumber).IsUnique();
            entity.Property(s => s.TripNumber).IsRequired().HasMaxLength(50);
            entity.Property(s => s.VehiclePlate).IsRequired().HasMaxLength(20);
            entity.Property(s => s.Origin).IsRequired().HasMaxLength(200);
            entity.Property(s => s.Destination).IsRequired().HasMaxLength(200);
            entity.Property(s => s.Status).HasConversion<int>();

            entity.HasOne(s => s.Driver)
                  .WithMany(u => u.Shipments)
                  .HasForeignKey(s => s.DriverId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Withdrawal
        modelBuilder.Entity<Withdrawal>(entity =>
        {
            entity.HasKey(w => w.Id);
            entity.Property(w => w.Amount).HasColumnType("decimal(18,2)");
            entity.Property(w => w.Reason).IsRequired().HasMaxLength(500);
            entity.Property(w => w.Status).HasConversion<int>();

            entity.HasOne(w => w.Shipment)
                  .WithMany(s => s.Withdrawals)
                  .HasForeignKey(w => w.ShipmentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(w => w.Manager)
                  .WithMany(u => u.ApprovedWithdrawals)
                  .HasForeignKey(w => w.ManagerId)
                  .OnDelete(DeleteBehavior.Restrict)
                  .IsRequired(false);

            entity.HasOne(w => w.Finance)
                  .WithMany()
                  .HasForeignKey(w => w.FinanceId)
                  .OnDelete(DeleteBehavior.Restrict)
                  .IsRequired(false);
        });

        // FuelClaim
        modelBuilder.Entity<FuelClaim>(entity =>
        {
            entity.HasKey(f => f.Id);
            entity.Property(f => f.ClaimAmount).HasColumnType("decimal(18,2)");
            entity.Property(f => f.Status).HasConversion<int>();

            entity.HasOne(f => f.Shipment)
                  .WithMany(s => s.FuelClaims)
                  .HasForeignKey(f => f.ShipmentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(f => f.Manager)
                  .WithMany()
                  .HasForeignKey(f => f.ManagerId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(f => f.Finance)
                  .WithMany()
                  .HasForeignKey(f => f.FinanceId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // AuditLog
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.TableName).IsRequired().HasMaxLength(100);
            entity.Property(a => a.Action).IsRequired().HasMaxLength(20);
            entity.Property(a => a.PerformedByName).IsRequired().HasMaxLength(100);

            entity.HasOne(a => a.PerformedBy)
                  .WithMany()
                  .HasForeignKey(a => a.PerformedById)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Seed data
        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = 1,
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                FullName = "System Admin",
                Role = UserRole.Admin,
                IsActive = true,
                CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                Id = 2,
                Username = "driver01",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("driver123"),
                FullName = "สมชาย ใจดี",
                Role = UserRole.Driver,
                IsActive = true,
                CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                Id = 3,
                Username = "manager01",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("manager123"),
                FullName = "นายวิชัย รักงาน",
                Role = UserRole.Manager,
                IsActive = true,
                CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                Id = 4,
                Username = "finance01",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("finance123"),
                FullName = "นางสาวมาลี บัญชีดี",
                Role = UserRole.Finance,
                IsActive = true,
                CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );
    }
}
