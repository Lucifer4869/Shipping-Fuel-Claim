namespace ShippingAPI.Models;

public class User//ส่วนของผู้ใช้
{
    public int Id { get; set; }//id ของผู้ใช้
    public string Username { get; set; } = string.Empty;//ชื่อผู้ใช้
    public string Email { get; set; } = string.Empty;//อีเมล (สำหรับ Google Login)
    public string PasswordHash { get; set; } = string.Empty;//รหัสผ่าน
    public string FullName { get; set; } = string.Empty;//ชื่อเต็ม
    public UserRole Role { get; set; }//บทบาทของผู้ใช้
    public string VehiclePlate { get; set; } = string.Empty;//ทะเบียนรถ
    public bool IsActive { get; set; } = true;//สถานะผู้ใช้
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;//วันเวลาที่สร้าง

    // Navigation
    public ICollection<Shipment> Shipments { get; set; } = new List<Shipment>();//รายการการเดินรถ
    public ICollection<Withdrawal> ApprovedWithdrawals { get; set; } = new List<Withdrawal>();//รายการเบิกเงิน
}
