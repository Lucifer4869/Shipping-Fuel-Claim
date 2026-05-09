using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShippingAPI.Data;
using ShippingAPI.DTOs;
using ShippingAPI.Models;
using ShippingAPI.Services;

namespace ShippingAPI.Controllers;

[ApiController]
[Route("api/withdrawals")]
[Authorize]
public class WithdrawalsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuditService _audit;

    public WithdrawalsController(AppDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    private int GetUserId() => int.Parse(User.FindFirstValue("userId")!);
    private string GetUserName() => User.FindFirstValue("fullName") ?? "";
    private string GetUserRole() => User.FindFirstValue(ClaimTypes.Role) ?? "";

    /// <summary>ดูรายการขอเบิกเงิน</summary>
    [HttpGet]
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

        var list = await query
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => new WithdrawalDto
            {
                Id = w.Id,
                ShipmentId = w.ShipmentId,
                DriverId = w.Shipment.DriverId,
                TripNumber = w.Shipment.TripNumber,
                VehiclePlate = w.Shipment.VehiclePlate,
                DriverName = w.Shipment.Driver.FullName,
                Amount = w.Amount,
                Reason = w.Reason,
                AdditionalItems = w.AdditionalItems,
                Status = w.Status.ToString(),
                Origin = w.Shipment.Origin,
                Destination = w.Shipment.Destination,
                StartMileage = w.Shipment.StartMileage,
                ManagerName = w.Manager != null ? w.Manager.FullName : null,
                ManagerNote = w.ManagerNote,
                ManagerApprovedAt = w.ManagerApprovedAt,
                FinanceName = w.Finance != null ? w.Finance.FullName : null,
                FinanceNote = w.FinanceNote,
                FinanceApprovedAt = w.FinanceApprovedAt,
                CreatedAt = w.CreatedAt
            })
            .ToListAsync();

        return Ok(list);
    }

    /// <summary>ส่งรายการขอเบิกเงิน (Driver เท่านั้น)</summary>
    [HttpPost]
    [Authorize(Roles = "Driver,Admin")]
    public async Task<ActionResult<WithdrawalDto>> CreateWithdrawal([FromBody] CreateWithdrawalRequest request)
    {
        var userId = GetUserId();

        var shipment = await _db.Shipments
            .Include(s => s.Driver)
            .FirstOrDefaultAsync(s => s.Id == request.ShipmentId);

        if (shipment == null) return NotFound(new { message = "ไม่พบข้อมูลการเดินรถ" });
        if (shipment.DriverId != userId) return Forbid();
        if (shipment.Status != ShipmentStatus.Active)
            return BadRequest(new { message = "การเดินรถนี้ไม่ได้อยู่ในสถานะ Active" });

        var withdrawal = new Withdrawal
        {
            ShipmentId = request.ShipmentId,
            Amount = request.Amount,
            Reason = request.Reason,
            AdditionalItems = request.AdditionalItems,
            CreatedAt = DateTime.UtcNow
        };

        _db.Withdrawals.Add(withdrawal);
        await _db.SaveChangesAsync();

        await _audit.LogAsync("Withdrawals", withdrawal.Id, "CREATE", null, request, userId, GetUserName(), GetUserRole());

        return CreatedAtAction(null, new WithdrawalDto
        {
            Id = withdrawal.Id,
            ShipmentId = withdrawal.ShipmentId,
            TripNumber = shipment.TripNumber,
            DriverName = shipment.Driver.FullName,
            Amount = withdrawal.Amount,
            Reason = withdrawal.Reason,
            Status = withdrawal.Status.ToString(),
            CreatedAt = withdrawal.CreatedAt
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
        // Removed check: if (withdrawal.Status != WithdrawalStatus.Pending) return BadRequest(...)

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
    [HttpPatch("{id}/finance-approve")]
    [Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> FinanceApprove(int id, [FromBody] ApproveWithdrawalRequest request)
    {
        var userId = GetUserId();
        var withdrawal = await _db.Withdrawals.FindAsync(id);

        if (withdrawal == null) return NotFound();
        // Removed check: if (withdrawal.Status != WithdrawalStatus.ApprovedByManager) return BadRequest(...)

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
