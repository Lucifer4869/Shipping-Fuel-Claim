using System.ComponentModel.DataAnnotations;

namespace ShippingAPI.DTOs; 

// Auth
public class LoginRequest //รหัสในการเข้าสู่ระบบ
{
    [Required] public string Username { get; set; } = string.Empty; //ชื่อผู้ใช้
    [Required] public string Password { get; set; } = string.Empty; //รหัสผ่าน
}

public class GoogleLoginRequest //การเข้าสู่ระบบผ่าน Google
{
    [Required] public string IdToken { get; set; } = string.Empty; //รหัสการเข้าสู่ระบบผ่าน Google
}

public class LoginResponse //แสดงข้อมูลหลังจากเข้าสู่ระบบสำเร็จ
{
    public string Token { get; set; } = string.Empty; //รหัสในการเข้าสู่ระบบ
    public string FullName { get; set; } = string.Empty; //ชื่อผู้ใช้
    public string Role { get; set; } = string.Empty; //บทบาท
    public string VehiclePlate { get; set; } = string.Empty; //ทะเบียนรถ
    public int UserId { get; set; }//รหัสผู้ใช้
}

// Shipment
public class CreateShipmentRequest //สร้างรายการเดินรถ
{
    [Required] public string VehiclePlate { get; set; } = string.Empty;//ทะเบียนรถ
    [Required] public string Origin { get; set; } = string.Empty;//ต้นทาง
    public double? OriginLat { get; set; }//ละติจูดต้นทาง
    public double? OriginLng { get; set; }//ลองจิจูดต้นทาง
    [Required] public string Destination { get; set; } = string.Empty;//ปลายทาง
    public double? DestinationLat { get; set; }//ละติจูดปลายทาง
    public double? DestinationLng { get; set; }//ลองจิจูดปลายทาง
    public double? RouteDistanceKm { get; set; }//ระยะทาง
    public string SenderName { get; set; } = string.Empty;//ชื่อผู้ส่ง
    public string SenderPhone { get; set; } = string.Empty;//เบอร์โทรผู้ส่ง
    public string ReceiverName { get; set; } = string.Empty;//ชื่อผู้รับ
    public string ReceiverPhone { get; set; } = string.Empty;//เบอร์โทรผู้รับ
    [Required] public double StartMileage { get; set; }//เลขไมล์เริ่มต้น
}

public class UpdateShipmentRequest //อัพเดทข้อมูลการเดินรถ
{
    public string VehiclePlate { get; set; } = string.Empty;//ทะเบียนรถ
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
    public double? StartMileage { get; set; }//เลขไมล์เริ่มต้น
}

public class ShipmentDto //แสดงข้อมูลการเดินรถ
{
    public int Id { get; set; }//รหัสการเดินรถ
    public string TripNumber { get; set; } = string.Empty;//เลขที่เดินรถ
    public string VehiclePlate { get; set; } = string.Empty;//ทะเบียนรถ
    public int DriverId { get; set; }//รหัสผู้ขับขี่
    public string DriverName { get; set; } = string.Empty;//ชื่อผู้ขับขี่
    public string Origin { get; set; } = string.Empty;//ต้นทาง
    public double? OriginLat { get; set; }//ละติจูดต้นทาง
    public double? OriginLng { get; set; }//ลองจิจูดต้นทาง
    public string Destination { get; set; } = string.Empty;//ปลายทาง
    public double? DestinationLat { get; set; }//ละติจูดปลายทาง
    public double? DestinationLng { get; set; }//ลองจิจูดปลายทาง
    public double? RouteDistanceKm { get; set; }//ระยะทาง
    public string SenderName { get; set; } = string.Empty;//ผู้ส่ง
    public string SenderPhone { get; set; } = string.Empty;//เบอร์โทรผู้ส่ง
    public string ReceiverName { get; set; } = string.Empty;//ผู้รับ
    public string ReceiverPhone { get; set; } = string.Empty;//เบอร์โทรผู้รับ
    public double StartMileage { get; set; }//เลขไมล์เริ่มต้น
    public double? EndMileage { get; set; }//เลขไมล์สุดท้าย
    public string Status { get; set; } = string.Empty;//สถานะ
    public DateTime CreatedAt { get; set; }//เวลาที่สร้าง
    public int WithdrawalCount { get; set; }//จำนวนครั้งที่เบิก
    public int FuelClaimCount { get; set; }//จำนวนครั้งที่เติม
}

// Withdrawal
public class CreateWithdrawalRequest//สร้างรายการเบิกเงิน
{
    [Required] public int ShipmentId { get; set; }//รหัสการเดินรถ
    [Required][Range(1, double.MaxValue)] public decimal Amount { get; set; }//จำนวนเงิน
    [Required] public string Reason { get; set; } = string.Empty;//เหตุผล
    public string? AdditionalItems { get; set; }//รายการเพิ่มเติม
}

public class ApproveWithdrawalRequest//อนุมัติการเบิกเงิน
{
    [Required] public bool IsApproved { get; set; }//อนุมัติ
    public string? Note { get; set; }//หมายเหตุ
}

public class WithdrawalDto//แสดงรายการเบิกเงิน
{
    public int Id { get; set; }//รหัสการเบิกเงิน
    public int ShipmentId { get; set; }//รหัสการเดินรถ
    public int DriverId { get; set; }//รหัสผู้ขับขี่
    public string TripNumber { get; set; } = string.Empty;//เลขที่เดินรถ
    public string VehiclePlate { get; set; } = string.Empty;//ทะเบียนรถ
    public string DriverName { get; set; } = string.Empty;//ชื่อผู้ขับขี่
    public decimal Amount { get; set; }//จำนวนเงิน
    public string Reason { get; set; } = string.Empty;//เหตุผล
    public string? AdditionalItems { get; set; }//รายการเพิ่มเติม
    public string Status { get; set; } = string.Empty;//สถานะ
    
    // ข้อมูลงานเดินรถที่เกี่ยวข้อง
    public string Origin { get; set; } = string.Empty;//ต้นทาง
    public string Destination { get; set; } = string.Empty;//ปลายทาง
    public double StartMileage { get; set; }//เลขไมล์เริ่มต้น

    public string? ManagerName { get; set; }//ชื่อผู้จัดการ
    public string? ManagerNote { get; set; }//หมายเหตุผู้จัดการ
    public DateTime? ManagerApprovedAt { get; set; }//วันที่อนุมัติโดยผู้จัดการ
    public string? FinanceName { get; set; }//ชื่อการเงิน
    public string? FinanceNote { get; set; }//หมายเหตุการเงิน
    public DateTime? FinanceApprovedAt { get; set; }//วันที่อนุมัติโดยการเงิน
    public DateTime CreatedAt { get; set; }//เวลาที่สร้าง
}

// FuelClaim
public class CreateFuelClaimRequest
{
    [Required] public int ShipmentId { get; set; }
    [Required][Range(1, double.MaxValue)] public decimal ClaimAmount { get; set; }
    public string? ReceiptUrl { get; set; }
    [Required] public double MileageOut { get; set; }
    [Required] public double MileageIn { get; set; }
}

public class ApproveFuelClaimRequest
{
    [Required] public bool IsApproved { get; set; }
    public string? Note { get; set; }
}

public class FuelClaimDto
{
    public int Id { get; set; }
    public int ShipmentId { get; set; }
    public int DriverId { get; set; }
    public string TripNumber { get; set; } = string.Empty;
    public string VehiclePlate { get; set; } = string.Empty; // เพิ่มทะเบียนรถ
    public string DriverName { get; set; } = string.Empty;
    public decimal ClaimAmount { get; set; }
    public string? ReceiptUrl { get; set; }
    public double MileageOut { get; set; }
    public double MileageIn { get; set; }
    public double Distance => MileageIn - MileageOut;
    public string Status { get; set; } = string.Empty;

    // ข้อมูลงานเดินรถที่เกี่ยวข้อง
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;

    public string? ManagerName { get; set; }
    public string? ManagerNote { get; set; }
    public DateTime? ManagerApprovedAt { get; set; }
    public string? FinanceName { get; set; }
    public string? FinanceNote { get; set; }
    public DateTime? FinanceApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

// AuditLog
public class AuditLogDto
{
    public int Id { get; set; }
    public string TableName { get; set; } = string.Empty;
    public int RecordId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string PerformedByName { get; set; } = string.Empty;
    public string? PerformedByRole { get; set; }
    public DateTime CreatedAt { get; set; }
}

// User Management
public class CreateUserRequest
{
    [Required] public string Username { get; set; } = string.Empty;
    [Required] public string Password { get; set; } = string.Empty;
    [Required] public string FullName { get; set; } = string.Empty;
    [Required] public string Role { get; set; } = string.Empty;
    public string VehiclePlate { get; set; } = string.Empty;
}

public class UpdateUserRequest
{
    public string? FullName { get; set; }
    public string? Role { get; set; }
    public string? Password { get; set; }
    public string? VehiclePlate { get; set; }
    public bool? IsActive { get; set; }
}

public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string VehiclePlate { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
