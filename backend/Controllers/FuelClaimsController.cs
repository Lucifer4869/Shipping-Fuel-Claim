using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShippingAPI.Data;
using ShippingAPI.DTOs;
using ShippingAPI.Models;
using ShippingAPI.Services;

namespace ShippingAPI.Controllers; //รายการเคลมน้ำมันครับผม เนืองจากเอาควบคุมการเครมค่าน้ำมันโดยแยกาลำดับชั้น role โดยมี driver, Manager และ Finance ครับผม

[ApiController]
[Route("api/claims")] //จัดการรายการเคลมน้ำมันครับผม
[Authorize] //ยืนยันตัวตนผู้ใช้
public class FuelClaimsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuditService _audit;

    public FuelClaimsController(AppDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    private int GetUserId() => int.Parse(User.FindFirstValue("userId")!);
    private string GetUserName() => User.FindFirstValue("fullName") ?? "";
    private string GetUserRole() => User.FindFirstValue(ClaimTypes.Role) ?? "";

    /// <summary>ดูรายการเคลมน้ำมัน</summary> http://localhost:3000/claim
    [HttpGet]
    public async Task<ActionResult<IEnumerable<FuelClaimDto>>> GetClaims([FromQuery] int? shipmentId = null)
    {
        var userId = GetUserId();
        var role = User.FindFirstValue(ClaimTypes.Role);

        var query = _db.FuelClaims
            .Include(f => f.Shipment).ThenInclude(s => s.Driver)
            .Include(f => f.Manager)
            .Include(f => f.Finance)
            .AsQueryable();

        if (shipmentId.HasValue)
            query = query.Where(f => f.ShipmentId == shipmentId.Value);

        if (role == "Driver")
            query = query.Where(f => f.Shipment.DriverId == userId);

        var list = await query
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new FuelClaimDto
            {
                Id = f.Id, // id ของรายการเคลมน้ำมัน
                ShipmentId = f.ShipmentId, //เลขที่ใบงาน
                DriverId = f.Shipment.DriverId,// id ของพนักงานขับรถ
                TripNumber = f.Shipment.TripNumber,//เลขที่ใบงาน
                VehiclePlate = f.Shipment.VehiclePlate,//ทะเบียนรถ
                DriverName = f.Shipment.Driver.FullName,// ชื่อพนักงานขับรถ
                ClaimAmount = f.ClaimAmount,// จำนวนเงินที่เคลม
                Reason = f.Reason, // เหตุผล
                ReceiptUrl = f.ReceiptUrl,// รูปใบเสร็จ
                MileageOut = f.MileageOut,// เลขไมล์ขาไป
                MileageIn = f.MileageIn,// เลขไมล์ขากลับ
                Status = f.Status.ToString(),// สถานะการเคลมน้ำมัน
                Origin = f.Shipment.Origin,// สถานที่เริ่มต้น
                Destination = f.Shipment.Destination,// สถานที่ปลายทาง
                ManagerName = f.Manager != null ? f.Manager.FullName : null,// ชื่อผู้จัดการ
                ManagerNote = f.ManagerNote,// หมายเหตุจากผู้จัดการ
                ManagerApprovedAt = f.ManagerApprovedAt,// วันเวลาที่ผู้จัดการอนุมัติ
                FinanceName = f.Finance != null ? f.Finance.FullName : null,// ชื่อผู้จัดการ
                FinanceNote = f.FinanceNote,// หมายเหตุจากผู้จัดการ
                FinanceApprovedAt = f.FinanceApprovedAt,// วันเวลาที่ผู้จัดการอนุมัติ
                CreatedAt = f.CreatedAt,// วันเวลาที่สร้าง
                ClaimNumber = f.ClaimNumber // รหัสอ้างอิง
            })
            .ToListAsync();

        return Ok(list);
    }

    /// <summary>ส่งรายการเคลมน้ำมัน (Driver เท่านั้น)</summary>
    [HttpPost] //roles driver, admin สามารถส่งเคลมได้ 
    [Authorize(Roles = "Driver,Admin")]
    public async Task<ActionResult<FuelClaimDto>> SubmitClaim([FromBody] CreateFuelClaimRequest request)
    {
        var userId = GetUserId();

        var shipment = await _db.Shipments
            .Include(s => s.Driver)
            .FirstOrDefaultAsync(s => s.Id == request.ShipmentId);

        if (shipment == null) return NotFound(new { message = "ไม่พบข้อมูลการเดินรถ" });
        if (shipment.DriverId != userId) return Forbid();
        if (shipment.Status != ShipmentStatus.Active) 
            return BadRequest(new { message = "ไม่สามารถส่งเคลมสำหรับงานที่ปิดไปแล้วหรือถูกยกเลิกได้" });
        
        if (request.ClaimAmount <= 0)
            return BadRequest(new { message = "จำนวนเงินต้องมากกว่า 0" });

        if (request.MileageIn <= request.MileageOut)
            return BadRequest(new { message = "ระยะทางขากลับต้องมากกว่าขาไป" });

        // Generate Claim Number: FLC-YYYYMMDD-XXXX
        var todayStr = DateTime.UtcNow.ToString("yyyyMMdd");
        var countToday = await _db.FuelClaims.CountAsync(f => f.CreatedAt.Date == DateTime.UtcNow.Date);
        var claimNumber = $"FLC-{todayStr}-{(countToday + 1):D4}";

        var claim = new FuelClaim
        {
            ShipmentId = request.ShipmentId,//เลขที่ใบงาน
            ClaimNumber = claimNumber, // รหัสอ้างอิง
            ClaimAmount = request.ClaimAmount,//จำนวนเงินที่เคลม
            Reason = request.Reason, // เหตุผล
            ReceiptUrl = request.ReceiptUrl,//รูปใบเสร็จ
            MileageOut = request.MileageOut,//เลขไมล์ขาไป
            MileageIn = request.MileageIn,//เลขไมล์ขากลับ
            CreatedAt = DateTime.UtcNow//วันที่สร้าง
        };

        _db.FuelClaims.Add(claim);
        await _db.SaveChangesAsync();

        await _audit.LogAsync("FuelClaims", claim.Id, "CREATE", null, request, userId, GetUserName(), GetUserRole());

        return CreatedAtAction(null, new FuelClaimDto
        {
            Id = claim.Id,// id ของรายการเคลมน้ำมัน
            ShipmentId = claim.ShipmentId,//เลขที่ใบงาน
            TripNumber = shipment.TripNumber,//เลขที่ใบงาน
            DriverName = shipment.Driver.FullName,// ชื่อพนักงานขับรถ
            ClaimAmount = claim.ClaimAmount,//จำนวนเงินที่เคลม
            MileageOut = claim.MileageOut,//เลขไมล์ขาไป
            MileageIn = claim.MileageIn,//เลขไมล์ขากลับ   
            Status = claim.Status.ToString(),//สถานะการเคลมน้ำมัน
            CreatedAt = claim.CreatedAt//วันที่สร้าง
        });
    }

    /// <summary>Manager อนุมัติหรือปฏิเสธเคลมน้ำมัน</summary>
    [HttpPatch("{id}/approve")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> ApproveClaim(int id, [FromBody] ApproveFuelClaimRequest request)
    {
        var userId = GetUserId();
        var claim = await _db.FuelClaims.FindAsync(id);

        if (claim == null) return NotFound();
        if (claim.Status != FuelClaimStatus.Pending) 
            return BadRequest(new { message = "รายการนี้ไม่อยู่ในสถานะที่รอการอนุมัติจาก Manager" });

        var oldStatus = claim.Status;//สถานะเดิม
        claim.Status = request.IsApproved ? FuelClaimStatus.ApprovedByManager : FuelClaimStatus.Rejected;//เปลี่ยนสถานะ
        claim.ManagerId = userId;//id ของ manager
        claim.ManagerNote = request.Note;//หมายเหตุจาก manager
        claim.ManagerApprovedAt = DateTime.UtcNow;//วันเวลาที่ manager อนุมัติ
        claim.UpdatedAt = DateTime.UtcNow;//วันเวลาที่แก้ไข

        await _db.SaveChangesAsync();
        await _audit.LogAsync("FuelClaims", id, "UPDATE",
            new { Status = oldStatus.ToString() },
            new { Status = claim.Status.ToString(), Note = request.Note },
            userId, GetUserName(), GetUserRole());

        return Ok(new { message = request.IsApproved ? "อนุมัติเคลมน้ำมันเรียบร้อย" : "ปฏิเสธเรียบร้อย" });
    }

    /// <summary>Finance อนุมัติขั้นสุดท้ายสำหรับการเคลมน้ำมัน</summary>
    [HttpPatch("{id}/finance-approve")]
    [Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> FinanceApproveClaim(int id, [FromBody] ApproveFuelClaimRequest request)
    {
        var userId = GetUserId();
        var claim = await _db.FuelClaims.FindAsync(id);

        if (claim == null) return NotFound();
        if (claim.Status != FuelClaimStatus.ApprovedByManager) 
            return BadRequest(new { message = "รายการนี้ต้องผ่านการอนุมัติจาก Manager ก่อนจึงจะดำเนินการในขั้นตอน Finance ได้" });

        var oldStatus = claim.Status;//สถานะเดิม
        claim.Status = request.IsApproved ? FuelClaimStatus.ApprovedByFinance : FuelClaimStatus.Rejected;//เปลี่ยนสถานะ
        claim.FinanceId = userId;//id ของ finance
        claim.FinanceNote = request.Note;//หมายเหตุจาก finance
        claim.FinanceApprovedAt = DateTime.UtcNow;//วันเวลาที่ finance อนุมัติ
        claim.UpdatedAt = DateTime.UtcNow;//วันเวลาที่แก้ไข

        await _db.SaveChangesAsync();
        await _audit.LogAsync("FuelClaims", id, "UPDATE",
            new { Status = oldStatus.ToString() },//สถานะเดิม
            new { Status = claim.Status.ToString(), Note = request.Note },//สถานะใหม่พร้อมหมายเหตุ
            userId, GetUserName(), GetUserRole());//ผู้ใช้และบทบาท

        return Ok(new { message = request.IsApproved ? "อนุมัติโดย Finance เรียบร้อย" : "ปฏิเสธเรียบร้อย" });
    }

    /// <summary>ลบรายการเคลมน้ำมัน (Admin เท่านั้น)</summary>
    [HttpDelete("{id}")]//ลบรายการเคลมน้ำมัน
    [Authorize(Roles = "Admin")]//ใช้ได้เฉพาะ admin
    public async Task<IActionResult> DeleteClaim(int id)//ลบรายการเคลมน้ำมัน
    {
        var userId = GetUserId();//id ของผู้ใช้
        var claim = await _db.FuelClaims.FindAsync(id);//id ของรายการเคลมน้ำมัน
        if (claim == null) return NotFound();//ไม่พบข้อมูล

        _db.FuelClaims.Remove(claim);//ลบรายการเคลมน้ำมัน
        await _db.SaveChangesAsync();//บันทึก
        await _audit.LogAsync("FuelClaims", id, "DELETE", //บันทึกการลบ
            new { claim.Id, claim.ShipmentId, claim.ClaimAmount, Status = claim.Status.ToString() }, 
            null, userId, GetUserName(), GetUserRole());

        return Ok(new { message = "ลบรายการเรียบร้อย" });
    }
}
