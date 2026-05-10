namespace ShippingAPI.Models; //ส่วนของการบันทึกข้อมูล

public class AuditLog //โมเดลสำหรับเก็บประวัติการเปลี่ยนแปลงข้อมูล
{
    public int Id { get; set; }//รหัสการบันทึก
    public string TableName { get; set; } = string.Empty;//ชื่อตาราง
    public int RecordId { get; set; }//รหัสของแถวข้อมูลที่ถูกเปลี่ยนแปลง
    public string Action { get; set; } = string.Empty; // CREATE, UPDATE, DELETE การกระทำ
    public string? OldValue { get; set; }//ค่าเดิม
    public string? NewValue { get; set; }//ค่าใหม่
    public int PerformedById { get; set; }//รหัสผู้ใช้งานที่ทำการเปลี่ยนแปลง
    public string PerformedByName { get; set; } = string.Empty;//ชื่อผู้ใช้งานที่ทำการเปลี่ยนแปลง
    public string PerformedByRole { get; set; } = string.Empty;//บทบาทของผู้ใช้งานที่ทำการเปลี่ยนแปลง
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;//เวลาที่ทำการเปลี่ยนแปลง

    // Navigation
    public User PerformedBy { get; set; } = null!;//ผู้ใช้งานที่ทำการเปลี่ยนแปลง
}
