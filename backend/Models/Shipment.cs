namespace ShippingAPI.Models; //ส่วนของการเดินรถ

public class Shipment //โมเดลสำหรับเก็บประวัติการเดินรถ
{
    public int Id { get; set; }//รหัสการเดินรถ
    public string TripNumber { get; set; } = string.Empty;//เลขที่เดินรถ
    public string VehiclePlate { get; set; } = string.Empty;//ทะเบียนรถ
    public int DriverId { get; set; }//รหัสผู้ขับขี่
    public string Origin { get; set; } = string.Empty;//ต้นทาง
    public double? OriginLat { get; set; }//ละติจูดต้นทาง
    public double? OriginLng { get; set; }//ลองจิจูดต้นทาง
    public string Destination { get; set; } = string.Empty;//ปลายทาง
    public double? DestinationLat { get; set; }//ละติจูดปลายทาง
    public double? DestinationLng { get; set; }//ลองจิจูดปลายทาง
    public double? RouteDistanceKm { get; set; }//ระยะทาง
    public string SenderName { get; set; } = string.Empty;//ชื่อผู้ส่ง
    public string SenderPhone { get; set; } = string.Empty;//เบอร์โทรผู้ส่ง
    public string ReceiverName { get; set; } = string.Empty;//ชื่อผู้รับ
    public string ReceiverPhone { get; set; } = string.Empty;//เบอร์โทรผู้รับ
    public double StartMileage { get; set; }//เลขไมล์เริ่มต้น
    public double? EndMileage { get; set; }//เลขไมล์สุดท้าย
    public ShipmentStatus Status { get; set; } = ShipmentStatus.Active;//สถานะการเดินรถ
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;//เวลาที่สร้าง
    public DateTime? UpdatedAt { get; set; }//เวลาที่อัปเดต

    // Navigation
    public User Driver { get; set; } = null!;//ผู้ขับขี่
    public ICollection<Withdrawal> Withdrawals { get; set; } = new List<Withdrawal>();//รายการเบิกเงิน
    public ICollection<FuelClaim> FuelClaims { get; set; } = new List<FuelClaim>();//รายการเติมน้ำมัน
}
