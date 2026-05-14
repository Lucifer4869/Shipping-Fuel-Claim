namespace ShippingAPI.Models; //ส่วนของการเติมน้ำมัน

public class FuelClaim //โมเดลสำหรับเก็บประวัติการเติมน้ำมัน
{
    public int Id { get; set; }//รหัสการเติมน้ำมัน
    public string ClaimNumber { get; set; } = string.Empty; // รหัสอ้างอิง เช่น FLC-20260514-001
    public int ShipmentId { get; set; }//รหัสการเดินรถ
    public decimal ClaimAmount { get; set; }//จำนวนเงินที่ขอเบิก
    public string Reason { get; set; } = string.Empty; // เหตุผลในการเคลม
    public string? ReceiptUrl { get; set; }//รูปภาพใบเสร็จ
    public double MileageOut { get; set; }//เลขไมล์ตอนออก
    public double MileageIn { get; set; }//เลขไมล์ตอนเข้า
    public FuelClaimStatus Status { get; set; } = FuelClaimStatus.Pending;//สถานะการเติมน้ำมัน
    
    public int? ManagerId { get; set; }//รหัสผู้จัดการ
    public string? ManagerNote { get; set; }//หมายเหตุผู้จัดการ
    public DateTime? ManagerApprovedAt { get; set; }//วันที่อนุมัติโดยผู้จัดการ
    
    public int? FinanceId { get; set; }//รหัสการเงิน
    public string? FinanceNote { get; set; }//หมายเหตุการเงิน
    public DateTime? FinanceApprovedAt { get; set; }//วันที่อนุมัติโดยการเงิน
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;//วันที่สร้าง
    public DateTime? UpdatedAt { get; set; }//วันที่อัปเดต

    // Navigation
    public Shipment Shipment { get; set; } = null!;//การเดินรถ
    public User? Manager { get; set; }//ผู้จัดการ
    public User? Finance { get; set; }//การเงิน
}
