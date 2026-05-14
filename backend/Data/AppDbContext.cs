using Microsoft.EntityFrameworkCore;
using ShippingAPI.Models;

namespace ShippingAPI.Data; 

public class AppDbContext : DbContext //คือตัวจัดการฐานข้อมูล
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();//ผู้ใช้งาน
    public DbSet<Shipment> Shipments => Set<Shipment>();//การเดินรถ
    public DbSet<Withdrawal> Withdrawals => Set<Withdrawal>();//การเบิกเงิน
    public DbSet<FuelClaim> FuelClaims => Set<FuelClaim>();//การเติมน้ำมัน
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();//การบันทึกข้อมูล
    public DbSet<UploadedFile> UploadedFiles => Set<UploadedFile>();//ไฟล์อัปโหลด

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(entity => //จัดการผู้ใช้งาน
        {
            entity.HasKey(u => u.Id);//รหัสผู้ใช้งาน
            entity.HasIndex(u => u.Username).IsUnique();//ชื่อผู้ใช้งานโดยห้ามซ้ำกันน่ะครับ
            entity.Property(u => u.Username).IsRequired().HasMaxLength(50);//ชื่อผู้ใช้งานแบบห้ามว่าง
            entity.Property(u => u.PasswordHash).IsRequired();//รหัสผ่าน
            entity.Property(u => u.FullName).IsRequired().HasMaxLength(100);//ชื่อ-นามสกุล
            entity.Property(u => u.Role).HasConversion<int>();//บทบาท
        });

        // Shipment เส้นทางการเดินรถ
        modelBuilder.Entity<Shipment>(entity =>
        {
            entity.HasKey(s => s.Id);//รหัสการเดินรถ
            entity.HasIndex(s => s.TripNumber).IsUnique();//เลขที่เดินรถ
            entity.Property(s => s.TripNumber).IsRequired().HasMaxLength(50);//เลขที่เดินรถ
            entity.Property(s => s.VehiclePlate).IsRequired().HasMaxLength(20);//ทะเบียนรถ
            entity.Property(s => s.Origin).IsRequired().HasMaxLength(200);//ต้นทาง
            entity.Property(s => s.Destination).IsRequired().HasMaxLength(200);//ปลายทาง
            entity.Property(s => s.Status).HasConversion<int>();//สถานะ

            entity.HasOne(s => s.Driver)//รหัสผู้ขับขี่
                  .WithMany(u => u.Shipments)//จำนวนการเดินรถ
                  .HasForeignKey(s => s.DriverId)//รหัสผู้ขับขี่
                  .OnDelete(DeleteBehavior.Cascade);//ถ้าลบคนขับ ให้ลบรายการเดินรถด้วย
        });

        // Withdrawal การเบิกเงิน
        modelBuilder.Entity<Withdrawal>(entity =>
        {
            entity.HasKey(w => w.Id);//รหัสการเบิกเงิน
            entity.Property(w => w.Amount).HasColumnType("decimal(18,2)");//จำนวนเงิน
            entity.Property(w => w.Reason).IsRequired().HasMaxLength(500);//เหตุผล
            entity.Property(w => w.Status).HasConversion<int>();//สถานะ

            entity.HasOne(w => w.Shipment)//เส้นทางการเดินรถ
                  .WithMany(s => s.Withdrawals)//จำนวนการเบิกเงิน
                  .HasForeignKey(w => w.ShipmentId)//รหัสการเบิกเงิน
                  .OnDelete(DeleteBehavior.Cascade);//เส้นทางการเดินรถ

            entity.HasOne(w => w.Manager)//ผู้จัดการ
                  .WithMany(u => u.ApprovedWithdrawals)//จำนวนการเบิกเงิน
                  .HasForeignKey(w => w.ManagerId)//รหัสผู้จัดการ
                  .OnDelete(DeleteBehavior.Restrict)// รายการที่อนุมัติโดยผู้จัดการคนนี้
                  .HasForeignKey(w => w.ManagerId)//รหัสผู้จัดการที่ใช้อ้างอิง
                  .OnDelete(DeleteBehavior.SetNull)//ถ้าลบผู้จัดการ ให้เซ็ตเป็น null
                  .IsRequired(false);//อนุญาตให้บันทึกข้อมูลได้โดยไม่ต้องใส่ชื่อผู้จัดการในตอนแรกครับ

            entity.HasOne(w => w.Finance)//การเงิน
                  .WithMany()//จำนวนการเบิกเงิน
                  .HasForeignKey(w => w.FinanceId)//รหัสการเงิน
                  .OnDelete(DeleteBehavior.SetNull)//ถ้าลบลบฝ่ายการเงิน ให้เซ็ตเป็น null
                  .IsRequired(false);//ไม่บังคับใส่ตอนสร้าง (เพราะฝ่ายการเงินจะเข้ามาจัดการในขั้นตอนสุดท้าย)
        });

        // FuelClaim การเบิกค่าน้ำมัน
        modelBuilder.Entity<FuelClaim>(entity =>
        {
            entity.HasKey(f => f.Id);//รหัสการเบิกค่าน้ำมัน
            entity.Property(f => f.ClaimAmount).HasColumnType("decimal(18,2)");//จำนวนเงิน
            entity.Property(f => f.Status).HasConversion<int>();//สถานะ

            entity.HasOne(f => f.Shipment)//เส้นทางการเดินรถ
                  .WithMany(s => s.FuelClaims)//จำนวนการเบิกค่าน้ำมัน
                  .HasForeignKey(f => f.ShipmentId)//รหัสการเบิกค่าน้ำมัน
                  .OnDelete(DeleteBehavior.Cascade);//เส้นทางการเดินรถ

            entity.HasOne(f => f.Manager)//ผู้จัดการ
                  .WithMany()//จำนวนการเบิกค่าน้ำมัน
                  .HasForeignKey(f => f.ManagerId)//รหัสการเบิกค่าน้ำมัน
                  .OnDelete(DeleteBehavior.SetNull);//ถ้าลบผู้จัดการ ให้เซ็ตเป็น null

            entity.HasOne(f => f.Finance)//การเงิน
                  .WithMany()//จำนวนการเบิกค่าน้ำมัน
                  .HasForeignKey(f => f.FinanceId)//รหัสการเบิกค่าน้ำมัน
                  .OnDelete(DeleteBehavior.SetNull);//ถ้าลบฝ่ายการเงิน ให้เซ็ตเป็น null
        });

        // AuditLog
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(a => a.Id);//รหัสการบันทึก
            entity.Property(a => a.TableName).IsRequired().HasMaxLength(100);//ชื่อตาราง
            entity.Property(a => a.Action).IsRequired().HasMaxLength(20);//การกระทำ
            entity.Property(a => a.PerformedByName).IsRequired().HasMaxLength(100);//ชื่อผู้กระทำ

            entity.HasOne(a => a.PerformedBy)//ผู้กระทำ
                  .WithMany()//จำนวนการบันทึก
                  .HasForeignKey(a => a.PerformedById)//รหัสผู้กระทำ
                  .OnDelete(DeleteBehavior.Cascade);//ถ้าลบผู้ใช้ ให้ลบประวัติ Audit Log ของเขาด้วย
        });

        // Seed data
        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder) //รายการพวกนี้ต้องลบทิ้งน่ะครับเพื่อความปลอดภัยครับผม เพิ่มเติมจากข้อมูลที่มีในระบบน่ะครับผม
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
