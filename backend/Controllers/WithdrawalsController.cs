using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShippingAPI.Data;
using ShippingAPI.DTOs;
using ShippingAPI.Models;
using ShippingAPI.Services;

namespace ShippingAPI.Controllers;

[ApiController]//จัดการการเบิกเงิน โดยหลักการใช้งานเหมือนกันคือต้องแผนการเดินรถก่อนถึงจะเบิกได้
[Route("api/withdrawals")]
[Authorize]//ต้องการการยืนยันตัวตน
public class WithdrawalsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuditService _audit;

    public WithdrawalsController(AppDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    private int GetUserId() => int.Parse(User.FindFirstValue("userId")!);//ดึงค่า id
    private string GetUserName() => User.FindFirstValue("fullName") ?? "";//ดึงค่าชื่อ
    private string GetUserRole() => User.FindFirstValue(ClaimTypes.Role) ?? "";//ดึงค่า role

    /// <summary>ดูรายการขอเบิกเงิน</summary>
    [HttpGet]//ต้องการการยืนยันตัวตน
    public async Task<ActionResult<IEnumerable<WithdrawalDto>>> GetWithdrawals([FromQuery] int? shipmentId = null)
    {
        var userId = GetUserId();
        var role = User.FindFirstValue(ClaimTypes.Role);

        var query = _db.Withdrawals
            .Include(w => w.Shipment).ThenInclude(s => s.Driver)
            .Include(w => w.Manager)
            .Include(w => w.Finance)
            .AsQueryable();

        if (shipmentId.HasValue)
            query = query.Where(w => w.ShipmentId == shipmentId.Value);

        if (role == "Driver")
            query = query.Where(w => w.Shipment.DriverId == userId);

        var list = await query //รายการที่ดึงค่า
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => new WithdrawalDto
            {
                Id = w.Id, //รหัสการเบิกเงิน
                ShipmentId = w.ShipmentId, //รหัสการเดินรถ
                DriverId = w.Shipment.DriverId, //รหัสผู้ขับขี่
                TripNumber = w.Shipment.TripNumber, //เลขที่เดินรถ
                VehiclePlate = w.Shipment.VehiclePlate, //ทะเบียนรถ
                DriverName = w.Shipment.Driver.FullName, //ชื่อผู้ขับขี่
                Amount = w.Amount, //จำนวนเงิน
                Reason = w.Reason, //เหตุผล
                AdditionalItems = w.AdditionalItems, //รายการเพิ่มเติม
                Status = w.Status.ToString(), //สถานะ
                Origin = w.Shipment.Origin, //ต้นทาง
                Destination = w.Shipment.Destination, //ปลายทาง
                StartMileage = w.Shipment.StartMileage, //ระยะทางเริ่มต้น
                ManagerName = w.Manager != null ? w.Manager.FullName : null, //ชื่อผู้จัดการ
                ManagerNote = w.ManagerNote, //หมายเหตุผู้จัดการ
                ManagerApprovedAt = w.ManagerApprovedAt, //วันที่อนุมัติโดยผู้จัดการ
                FinanceName = w.Finance != null ? w.Finance.FullName : null, //ชื่อการเงิน
                FinanceNote = w.FinanceNote, //หมายเหตุการเงิน
                FinanceApprovedAt = w.FinanceApprovedAt, //วันที่อนุมัติโดยการเงิน
                CreatedAt = w.CreatedAt, //วันที่สร้าง
                WithdrawalNumber = w.WithdrawalNumber // รหัสอ้างอิง
            })
            .ToListAsync();

        return Ok(list);
    }

    /// <summary>ส่งรายการขอเบิกเงิน (Driver เท่านั้น)</summary>
    [HttpPost]//ต้องการการยืนยันตัวตน
    [Authorize(Roles = "Driver,Admin")]//ต้องการการยืนยันตัวตน
    public async Task<ActionResult<WithdrawalDto>> CreateWithdrawal([FromBody] CreateWithdrawalRequest request)
    {
        var userId = GetUserId();//ดึงค่า id

        var shipment = await _db.Shipments//ดึงข้อมูลการเดินรถ
            .Include(s => s.Driver)
            .FirstOrDefaultAsync(s => s.Id == request.ShipmentId);

        if (shipment == null) return NotFound(new { message = "ไม่พบข้อมูลการเดินรถ" });
        if (shipment.DriverId != userId) return Forbid();
        if (shipment.Status != ShipmentStatus.Active)
            return BadRequest(new { message = "ไม่สามารถขอเบิกเงินสำหรับงานที่ปิดไปแล้วหรือถูกยกเลิกได้" });

        if (request.Amount <= 0)
            return BadRequest(new { message = "จำนวนเงินที่ขอเบิกต้องมากกว่า 0" });

        // Check for duplicate withdrawal (Same shipment, same amount, same reason)
        var isDuplicate = await _db.Withdrawals.AnyAsync(w => 
            w.ShipmentId == request.ShipmentId && 
            w.Amount == request.Amount && 
            w.Reason == request.Reason &&
            w.Status != WithdrawalStatus.Rejected); // ยกเว้นรายการที่ถูกปฏิเสธไปแล้ว

        if (isDuplicate)
            return BadRequest(new { message = "รายการขอเบิกเงินนี้ถูกส่งเข้าระบบแล้ว (ตรวจพบข้อมูลซ้ำ)" });

        // Generate Withdrawal Number: WTH-YYYYMMDD-XXXX
        var todayStr = DateTime.UtcNow.ToString("yyyyMMdd");
        var countToday = await _db.Withdrawals.CountAsync(w => w.CreatedAt.Date == DateTime.UtcNow.Date);
        var withdrawalNumber = $"WTH-{todayStr}-{(countToday + 1):D4}";

        var withdrawal = new Withdrawal
        {
            ShipmentId = request.ShipmentId, //รหัสการเดินรถ
            WithdrawalNumber = withdrawalNumber, // รหัสอ้างอิง
            Amount = request.Amount, //จำนวนเงิน
            Reason = request.Reason, //เหตุผล
            AdditionalItems = request.AdditionalItems, //รายการเพิ่มเติม
            CreatedAt = DateTime.UtcNow //วันที่สร้าง
        };

        _db.Withdrawals.Add(withdrawal);
        await _db.SaveChangesAsync();

        await _audit.LogAsync("Withdrawals", withdrawal.Id, "CREATE", null, request, userId, GetUserName(), GetUserRole());

        return CreatedAtAction(null, new WithdrawalDto
        {
            Id = withdrawal.Id, //รหัสการเบิกเงิน
            ShipmentId = withdrawal.ShipmentId,//รหัสการเดินรถ
            TripNumber = shipment.TripNumber,//เลขที่เดินรถ
            DriverName = shipment.Driver.FullName,//ชื่อผู้ขับขี่
            Amount = withdrawal.Amount,//จำนวนเงิน
            Reason = withdrawal.Reason,//เหตุผล
            Status = withdrawal.Status.ToString(),//สถานะ
            CreatedAt = withdrawal.CreatedAt//วันที่สร้าง
        });
    }

    /// <summary>Manager อนุมัติหรือปฏิเสธการขอเบิก</summary>
    [HttpPatch("{id}/approve")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> ManagerApprove(int id, [FromBody] ApproveWithdrawalRequest request)
    {
        var userId = GetUserId();
        var withdrawal = await _db.Withdrawals
            .Include(w => w.Shipment)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (withdrawal == null) return NotFound();
        if (withdrawal.Status != WithdrawalStatus.Pending) 
            return BadRequest(new { message = "รายการนี้ไม่อยู่ในสถานะที่รอการอนุมัติจาก Manager" });

        var oldStatus = withdrawal.Status;
        withdrawal.Status = request.IsApproved ? WithdrawalStatus.ApprovedByManager : WithdrawalStatus.Rejected;
        withdrawal.ManagerId = userId;
        withdrawal.ManagerNote = request.Note;
        withdrawal.ManagerApprovedAt = DateTime.UtcNow;
        withdrawal.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _audit.LogAsync("Withdrawals", id, "UPDATE",
            new { Status = oldStatus.ToString() },
            new { Status = withdrawal.Status.ToString(), Note = request.Note },
            userId, GetUserName(), GetUserRole());

        return Ok(new { message = request.IsApproved ? "อนุมัติเรียบร้อย" : "ปฏิเสธเรียบร้อย" });
    }

    /// <summary>Finance อนุมัติขั้นสุดท้าย</summary>
    [HttpPatch("{id}/finance-approve")]//แก้ไขลำดับการอนุมัติโดยการเงิน
    [Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> FinanceApprove(int id, [FromBody] ApproveWithdrawalRequest request)
    {
        var userId = GetUserId();
        var withdrawal = await _db.Withdrawals.FindAsync(id);

        if (withdrawal == null) return NotFound();
        if (withdrawal.Status != WithdrawalStatus.ApprovedByManager) 
            return BadRequest(new { message = "รายการนี้ต้องผ่านการอนุมัติจาก Manager ก่อนจึงจะดำเนินการในขั้นตอน Finance ได้" });

        var oldStatus = withdrawal.Status;
        withdrawal.Status = request.IsApproved ? WithdrawalStatus.ApprovedByFinance : WithdrawalStatus.Rejected;
        withdrawal.FinanceId = userId;
        withdrawal.FinanceNote = request.Note;
        withdrawal.FinanceApprovedAt = DateTime.UtcNow;
        withdrawal.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _audit.LogAsync("Withdrawals", id, "UPDATE",
            new { Status = oldStatus.ToString() },
            new { Status = withdrawal.Status.ToString(), Note = request.Note },
            userId, GetUserName(), GetUserRole());

        return Ok(new { message = request.IsApproved ? "อนุมัติโดย Finance เรียบร้อย" : "ปฏิเสธเรียบร้อย" });
    }

    /// <summary>ลบรายการขอเบิกเงิน (Admin เท่านั้น)</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteWithdrawal(int id)
    {
        var userId = GetUserId();
        var withdrawal = await _db.Withdrawals.FindAsync(id);
        if (withdrawal == null) return NotFound();

        _db.Withdrawals.Remove(withdrawal);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("Withdrawals", id, "DELETE", 
            new { withdrawal.Id, withdrawal.ShipmentId, withdrawal.Amount, withdrawal.Reason, Status = withdrawal.Status.ToString() }, 
            null, userId, GetUserName(), GetUserRole());

        return Ok(new { message = "ลบรายการเรียบร้อย" });
    }
}
