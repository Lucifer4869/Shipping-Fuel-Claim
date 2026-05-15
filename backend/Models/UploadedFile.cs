namespace ShippingAPI.Models;

public class UploadedFile
{
    public Guid Id { get; set; }//รหัสไฟล์
    public string FileName { get; set; } = string.Empty;//ชื่อไฟล์
    public string ContentType { get; set; } = string.Empty;//ประเภทไฟล์
    public byte[] FileData { get; set; } = Array.Empty<byte>();//ข้อมูลไฟล์
    public string ContentHash { get; set; } = string.Empty; // ค่า Hash ของไฟล์สำหรับเช็คซ้ำ
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;//เวลาที่อัปโหลด
}
