namespace ShippingAPI.Models;

public class Withdrawal //ส่วนของการขอเบิกเงิน
{
    public int Id { get; set; } //รหัสการเบิกเงิน
    public int ShipmentId { get; set; } //รหัสการเดินรถ
    public decimal Amount { get; set; } //จำนวนเงิน
    public string Reason { get; set; } = string.Empty; //เหตุผล
    public string? AdditionalItems { get; set; } //รายการอื่นๆ
    public WithdrawalStatus Status { get; set; } = WithdrawalStatus.Pending; //สถานะ
    public int? ManagerId { get; set; } //รหัสผู้จัดการ
    public string? ManagerNote { get; set; } //หมายเหตุผู้จัดการ
    public DateTime? ManagerApprovedAt { get; set; } //วันที่อนุมัติโดยผู้จัดการ
    public int? FinanceId { get; set; } //รหัสการเงิน
    public string? FinanceNote { get; set; } //หมายเหตุการเงิน
    public DateTime? FinanceApprovedAt { get; set; } //วันที่อนุมัติโดยการเงิน
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow; //วันเวลาที่สร้าง
    public DateTime? UpdatedAt { get; set; } //วันเวลาที่อัปเดต

    // Navigation
    public Shipment Shipment { get; set; } = null!;//เส้นทางการเดินรถ
    public User? Manager { get; set; }//ผู้จัดการ
    public User? Finance { get; set; }//การเงิน
}
