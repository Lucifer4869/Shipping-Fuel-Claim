using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShippingAPI.Data;
using ShippingAPI.DTOs;
using ShippingAPI.Models;
using ShippingAPI.Services;

namespace ShippingAPI.Controllers; 

[ApiController]//จัดการรายการเดินรถครับผม  เผื่อไปยื่นกับใช้สำหรับการเบิกหรือเคลมค่าน้ำมันครับผม โดยเก็บระยะทางข้อมูลการขนส่งไว้ครับผม โดยเอาระยะทางหรือตำแหน่งมากจาก gps
[Route("api/shipments")]
[Authorize] //ยืนยันตัวตนผู้ใช้
public class ShipmentsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuditService _audit;

    public ShipmentsController(AppDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    private int GetUserId() => int.Parse(User.FindFirstValue("userId")!); 
    private string GetUserName() => User.FindFirstValue("fullName") ?? "";
    private string GetUserRole() => User.FindFirstValue(ClaimTypes.Role) ?? "";

    /// <summary>ดูรายการเดินรถทั้งหมด (Admin/Manager/Finance เห็นทั้งหมด, Driver เห็นเฉพาะของตัวเองหรือ ID ของใครของมัน)</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ShipmentDto>>> GetShipments()
    {
        var userId = GetUserId();
        var role = User.FindFirstValue(ClaimTypes.Role);

        var query = _db.Shipments //รหัสการเดินรถ
            .Include(s => s.Driver) //ชื่อผู้ขับขี่
            .Include(s => s.Withdrawals) //จำนวนครั้งที่เบิก
            .Include(s => s.FuelClaims) //จำนวนครั้งที่เคลม
            .AsQueryable();

        if (role == "Driver")
            query = query.Where(s => s.DriverId == userId);

        var shipments = await query
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new ShipmentDto
            {
                Id = s.Id, //รหัสการเดินรถ
                TripNumber = s.TripNumber, //เลขที่เดินรถ
                VehiclePlate = s.VehiclePlate, //ทะเบียนรถ
                DriverId = s.DriverId, //รหัสผู้ขับขี่
                DriverName = s.Driver.FullName, //ชื่อผู้ขับขี่
                Origin = s.Origin, //ต้นทาง
                OriginLat = s.OriginLat, //ละติจูดต้นทาง
                OriginLng = s.OriginLng, //ลองจิจูดต้นทาง
                Destination = s.Destination, //ปลายทาง
                DestinationLat = s.DestinationLat, //ละติจูดปลายทาง
                DestinationLng = s.DestinationLng, //ลองจิจูดปลายทาง
                RouteDistanceKm = s.RouteDistanceKm, //ระยะทาง
                SenderName = s.SenderName, //ชื่อผู้ส่ง
                SenderPhone = s.SenderPhone, //เบอร์โทรผู้ส่ง
                ReceiverName = s.ReceiverName, //ชื่อผู้รับ
                ReceiverPhone = s.ReceiverPhone, //เบอร์โทรผู้รับ
                StartMileage = s.StartMileage, //เลขไมล์ตอนออก
                EndMileage = s.EndMileage, //เลขไมล์ตอนกลับ
                Status = s.Status.ToString(), //สถานะ
                CreatedAt = s.CreatedAt, //วันที่สร้าง
                WithdrawalCount = s.Withdrawals.Count,//จำนวนครั้งที่เบิก
                FuelClaimCount = s.FuelClaims.Count//จำนวนครั้งที่เคลม
            })
            .ToListAsync();

        return Ok(shipments);
    }

    /// <summary>ดูรายละเอียดเดินรถ</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ShipmentDto>> GetShipment(int id)
    {
        var userId = GetUserId();
        var role = User.FindFirstValue(ClaimTypes.Role);

        var s = await _db.Shipments //รหัสการเดินรถ
            .Include(s => s.Driver) //ชื่อผู้ขับขี่
            .Include(s => s.Withdrawals) //จำนวนครั้งที่เบิก
            .Include(s => s.FuelClaims) //จำนวนครั้งที่เคลม
            .FirstOrDefaultAsync(s => s.Id == id); //รหัสการเดินรถ

        if (s == null) return NotFound();
        if (role == "Driver" && s.DriverId != userId) return Forbid();

        return Ok(new ShipmentDto
        {
            Id = s.Id, //รหัสการเดินรถ
            TripNumber = s.TripNumber, //เลขที่เดินรถ
            VehiclePlate = s.VehiclePlate, //ทะเบียนรถ
            DriverId = s.DriverId, //รหัสผู้ขับขี่
            DriverName = s.Driver.FullName, //ชื่อผู้ขับขี่
            Origin = s.Origin, //ต้นทาง
            Destination = s.Destination, //ปลายทาง
            StartMileage = s.StartMileage, //เลขไมล์ตอนออก
            EndMileage = s.EndMileage, //เลขไมล์ตอนกลับ
            Status = s.Status.ToString(), //สถานะ
            CreatedAt = s.CreatedAt, //วันที่สร้าง
            WithdrawalCount = s.Withdrawals.Count, //จำนวนครั้งที่เบิก
            FuelClaimCount = s.FuelClaims.Count //จำนวนครั้งที่เคลม
        });
    }

    /// <summary>สร้างเลขที่เดินรถใหม่ (Driver เท่านั้น)</summary>
    [HttpPost]
    [Authorize(Roles = "Driver,Admin")]
    public async Task<ActionResult<ShipmentDto>> CreateShipment([FromBody] CreateShipmentRequest request)
    {
        var userId = GetUserId(); //รหัสผู้ใช้
        var tripNumber = $"TRP-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}"; //เลขที่เดินรถ

        var shipment = new Shipment
        {
            TripNumber = tripNumber, //เลขที่เดินรถ
            VehiclePlate = request.VehiclePlate, //ทะเบียนรถ
            DriverId = userId, //รหัสผู้ขับขี่
            Origin = request.Origin, //ต้นทาง
            OriginLat = request.OriginLat, //ละติจูดต้นทาง
            OriginLng = request.OriginLng, //ลองจิจูดต้นทาง
            Destination = request.Destination, //ปลายทาง
            DestinationLat = request.DestinationLat, //ละติจูดปลายทาง
            DestinationLng = request.DestinationLng, //ลองจิจูดปลายทาง
            RouteDistanceKm = request.RouteDistanceKm, //ระยะทาง
            SenderName = request.SenderName, //ชื่อผู้ส่ง
            SenderPhone = request.SenderPhone, //เบอร์โทรผู้ส่ง
            ReceiverName = request.ReceiverName, //ชื่อผู้รับ
            ReceiverPhone = request.ReceiverPhone, //เบอร์โทรผู้รับ
            StartMileage = request.StartMileage, //เลขไมล์ตอนออก
            CreatedAt = DateTime.UtcNow //วันที่สร้าง
        };

        _db.Shipments.Add(shipment); //เพิ่มข้อมูลการเดินรถ
        await _db.SaveChangesAsync(); //บันทึกข้อมูลการเดินรถ

        await _audit.LogAsync("Shipments", shipment.Id, "CREATE", null, request, userId, GetUserName(), GetUserRole()); //เพิ่มข้อมูลการเดินรถ

        var driver = await _db.Users.FindAsync(userId); //รหัสผู้ใช้
        return CreatedAtAction(nameof(GetShipment), new { id = shipment.Id }, new ShipmentDto
        {
            Id = shipment.Id, //รหัสการเดินรถ
            TripNumber = shipment.TripNumber, //เลขที่เดินรถ
            VehiclePlate = shipment.VehiclePlate, //ทะเบียนรถ
            DriverId = shipment.DriverId, //รหัสผู้ขับขี่
            DriverName = driver?.FullName ?? "", //ชื่อผู้ขับขี่
            Origin = shipment.Origin, //ต้นทาง
            OriginLat = shipment.OriginLat, //ละติจูดต้นทาง
            OriginLng = shipment.OriginLng, //ลองจิจูดต้นทาง
            Destination = shipment.Destination, //ปลายทาง
            DestinationLat = shipment.DestinationLat, //ละติจูดปลายทาง
            DestinationLng = shipment.DestinationLng, //ลองจิจูดปลายทาง
            RouteDistanceKm = shipment.RouteDistanceKm, //ระยะทาง
            SenderName = shipment.SenderName, //ชื่อผู้ส่ง
            SenderPhone = shipment.SenderPhone, //เบอร์โทรผู้ส่ง
            ReceiverName = shipment.ReceiverName, //ชื่อผู้รับ
            ReceiverPhone = shipment.ReceiverPhone, //เบอร์โทรผู้รับ
            StartMileage = shipment.StartMileage, //เลขไมล์ตอนออก
            Status = shipment.Status.ToString(), //สถานะ
            CreatedAt = shipment.CreatedAt //วันที่สร้าง
        });
    }

    /// <summary>อัปเดตข้อมูลเดินรถ</summary> เอาไว้แก้ไขการข้อมูลการเดินรถ
    [HttpPut("{id}")]//แก้ไขข้อมูลเดินรถ
    [Authorize(Roles = "Driver,Admin")]//ใช้ได้เฉพาะ driver กับ admin
    public async Task<IActionResult> UpdateShipment(int id, [FromBody] UpdateShipmentRequest request)//อัปเดตข้อมูลเดินรถ
    {
        var userId = GetUserId();//id ของผู้ใช้
        var role = User.FindFirstValue(ClaimTypes.Role);//บทบาทของผู้ใช้
        var shipment = await _db.Shipments.FindAsync(id);//id ของรายการเดินรถ

        if (shipment == null) return NotFound();//ไม่พบข้อมูล
        if (role == "Driver" && shipment.DriverId != userId) return Forbid();//ถ้าเป็น driver กับ shipment.DriverId ไม่ใช่ userId ให้ return Forbid()
        if (shipment.Status != ShipmentStatus.Active && role != "Admin") //ถ้าเป็น shipment.Status Active กับ role ไม่ใช่ Admin ให้ return BadRequest()
            return BadRequest(new { message = "ไม่สามารถแก้ไขการเดินรถที่เสร็จสิ้นหรือยกเลิกแล้วได้" });//ถ้าไม่สามารถแก้ไขการเดินรถที่เสร็จสิ้นหรือยกเลิกแล้วได้

        var oldValues = new { 
            shipment.VehiclePlate, shipment.Origin, shipment.Destination, 
            shipment.SenderName, shipment.SenderPhone, shipment.ReceiverName, shipment.ReceiverPhone,
            shipment.StartMileage 
        };

        if (!string.IsNullOrEmpty(request.VehiclePlate)) shipment.VehiclePlate = request.VehiclePlate;//ทะเบียนรถ
        if (!string.IsNullOrEmpty(request.Origin)) shipment.Origin = request.Origin;//ต้นทาง
        if (request.OriginLat.HasValue) shipment.OriginLat = request.OriginLat;//ละติจูดต้นทาง
        if (request.OriginLng.HasValue) shipment.OriginLng = request.OriginLng;//ลองจิจูดต้นทาง
        if (!string.IsNullOrEmpty(request.Destination)) shipment.Destination = request.Destination;//ปลายทาง
        if (request.DestinationLat.HasValue) shipment.DestinationLat = request.DestinationLat;//ละติจูดปลายทาง
        if (request.DestinationLng.HasValue) shipment.DestinationLng = request.DestinationLng;//ลองจิจูดปลายทาง
        if (request.RouteDistanceKm.HasValue) shipment.RouteDistanceKm = request.RouteDistanceKm;//ระยะทาง
        
        if (request.SenderName != null) shipment.SenderName = request.SenderName;//ชื่อผู้ส่ง
        if (request.SenderPhone != null) shipment.SenderPhone = request.SenderPhone;//เบอร์โทรผู้ส่ง
        if (request.ReceiverName != null) shipment.ReceiverName = request.ReceiverName;//ชื่อผู้รับ
        if (request.ReceiverPhone != null) shipment.ReceiverPhone = request.ReceiverPhone;//เบอร์โทรผู้รับ
        
        if (request.StartMileage.HasValue) shipment.StartMileage = request.StartMileage.Value;//เลขไมล์ตอนออก

        shipment.UpdatedAt = DateTime.UtcNow;//วันเวลาที่แก้ไข

        await _db.SaveChangesAsync();//บันทึกข้อมูลลงฐานข้อมูล

        var newValues = new { 
            shipment.VehiclePlate, shipment.Origin, shipment.Destination, 
            shipment.SenderName, shipment.SenderPhone, shipment.ReceiverName, shipment.ReceiverPhone,
            shipment.StartMileage 
        };
        await _audit.LogAsync("Shipments", id, "UPDATE", oldValues, newValues, userId, GetUserName(), GetUserRole());

        return NoContent();
    }

    /// <summary>อัปเดตสถานะเดินรถ</summary>  //เอาไว้ยื่นยันสถานะในการเดินรถ ว่าถึงที่หมายแล้ว
    [HttpPatch("{id}/complete")]//อัปเดตสถานะเดินรถ
    [Authorize(Roles = "Driver,Admin")]//ใช้ได้เฉพาะ driver กับ admin
    public async Task<IActionResult> CompleteShipment(int id, [FromBody] double endMileage)//อัปเดตสถานะเดินรถ
    {
        var userId = GetUserId();//id ของผู้ใช้
        var role = GetUserRole();//บทบาทของผู้ใช้
        var shipment = await _db.Shipments.FindAsync(id);//id ของรายการเดินรถ

        if (shipment == null) return NotFound();//ไม่พบข้อมูล
        
        // Admin สามารถปิดงานได้ทุกคน, Driver ปิดได้เฉพาะงานตัวเอง
        if (role != "Admin" && shipment.DriverId != userId) return Forbid();//ถ้าเป็น driver กับ shipment.DriverId ไม่ใช่ userId ให้ return Forbid()
        
        if (shipment.Status != ShipmentStatus.Active) return BadRequest(new { message = "การเดินรถนี้ไม่ได้อยู่ในสถานะ Active" });//ถ้าไม่สามารถแก้ไขการเดินรถที่เสร็จสิ้นหรือยกเลิกแล้วได้

        var oldStatus = shipment.Status;//oldStatus = status ปัจจุบัน
        shipment.Status = ShipmentStatus.Completed;//status = completed
        shipment.EndMileage = endMileage;//เลขไมล์ตอนออก
        shipment.UpdatedAt = DateTime.UtcNow;//วันเวลาที่แก้ไข

        await _db.SaveChangesAsync();//บันทึกข้อมูลลงฐานข้อมูล
        await _audit.LogAsync("Shipments", id, "UPDATE",//id ของรายการเดินรถ
            new { Status = oldStatus.ToString() },
            new { Status = "Completed", EndMileage = endMileage },
            userId, GetUserName(), GetUserRole());//id ของผู้ใช้,ชื่อผู้ใช้,บทบาทของผู้ใช้

        return NoContent();
    }

    /// <summary>ลบข้อมูลการเดินรถ (Admin เท่านั้น)</summary>
    [HttpDelete("{id}")]//ลบข้อมูลการเดินรถ
    [Authorize(Roles = "Admin")]//ใช้ได้เฉพาะ admin
    public async Task<IActionResult> DeleteShipment(int id)//ลบข้อมูลการเดินรถ
    {
        var shipment = await _db.Shipments//id ของรายการเดินรถ
            .Include(s => s.Withdrawals)//id ของการเบิก
            .Include(s => s.FuelClaims)//id ของการเติมน้ำมัน
            .FirstOrDefaultAsync(s => s.Id == id);//id ของรายการเดินรถ

        if (shipment == null) return NotFound();//ไม่พบข้อมูล

        // Remove associated records first to avoid foreign key violations
        if (shipment.Withdrawals.Any())
            _db.Withdrawals.RemoveRange(shipment.Withdrawals);
        
        if (shipment.FuelClaims.Any())
            _db.FuelClaims.RemoveRange(shipment.FuelClaims);

        _db.Shipments.Remove(shipment);
        await _db.SaveChangesAsync();

        await _audit.LogAsync("Shipments", id, "DELETE", new { shipment.TripNumber }, null, GetUserId(), GetUserName(), GetUserRole());

        return NoContent();
    }
}
