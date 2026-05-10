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
                Id = f.Id,
                ShipmentId = f.ShipmentId,
                DriverId = f.Shipment.DriverId,
                TripNumber = f.Shipment.TripNumber,
                VehiclePlate = f.Shipment.VehiclePlate,
                DriverName = f.Shipment.Driver.FullName,
                ClaimAmount = f.ClaimAmount,
                ReceiptUrl = f.ReceiptUrl,
                MileageOut = f.MileageOut,
                MileageIn = f.MileageIn,
                Status = f.Status.ToString(),
                Origin = f.Shipment.Origin,
                Destination = f.Shipment.Destination,
                ManagerName = f.Manager != null ? f.Manager.FullName : null,
                ManagerNote = f.ManagerNote,
                ManagerApprovedAt = f.ManagerApprovedAt,
                FinanceName = f.Finance != null ? f.Finance.FullName : null,
                FinanceNote = f.FinanceNote,
                FinanceApprovedAt = f.FinanceApprovedAt,
                CreatedAt = f.CreatedAt
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
        if (request.MileageIn <= request.MileageOut)
            return BadRequest(new { message = "ระยะทางขากลับต้องมากกว่าขาไป" });

        var claim = new FuelClaim
        {
            ShipmentId = request.ShipmentId,
            ClaimAmount = request.ClaimAmount,
            ReceiptUrl = request.ReceiptUrl,
            MileageOut = request.MileageOut,
            MileageIn = request.MileageIn,
            CreatedAt = DateTime.UtcNow
        };

        _db.FuelClaims.Add(claim);
        await _db.SaveChangesAsync();

        await _audit.LogAsync("FuelClaims", claim.Id, "CREATE", null, request, userId, GetUserName(), GetUserRole());

        return CreatedAtAction(null, new FuelClaimDto
        {
            Id = claim.Id,
            ShipmentId = claim.ShipmentId,
            TripNumber = shipment.TripNumber,
            DriverName = shipment.Driver.FullName,
            ClaimAmount = claim.ClaimAmount,
            MileageOut = claim.MileageOut,
            MileageIn = claim.MileageIn,
            Status = claim.Status.ToString(),
            CreatedAt = claim.CreatedAt
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
        // Removed check: if (claim.Status != FuelClaimStatus.Pending) return BadRequest(...)

        var oldStatus = claim.Status;
        claim.Status = request.IsApproved ? FuelClaimStatus.ApprovedByManager : FuelClaimStatus.Rejected;
        claim.ManagerId = userId;
        claim.ManagerNote = request.Note;
        claim.ManagerApprovedAt = DateTime.UtcNow;
        claim.UpdatedAt = DateTime.UtcNow;

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
        // Removed check for changing status easily

        var oldStatus = claim.Status;
        claim.Status = request.IsApproved ? FuelClaimStatus.ApprovedByFinance : FuelClaimStatus.Rejected;
        claim.FinanceId = userId;
        claim.FinanceNote = request.Note;
        claim.FinanceApprovedAt = DateTime.UtcNow;
        claim.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _audit.LogAsync("FuelClaims", id, "UPDATE",
            new { Status = oldStatus.ToString() },
            new { Status = claim.Status.ToString(), Note = request.Note },
            userId, GetUserName(), GetUserRole());

        return Ok(new { message = request.IsApproved ? "อนุมัติโดย Finance เรียบร้อย" : "ปฏิเสธเรียบร้อย" });
    }

    /// <summary>ลบรายการเคลมน้ำมัน (Admin เท่านั้น)</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteClaim(int id)
    {
        var userId = GetUserId();
        var claim = await _db.FuelClaims.FindAsync(id);
        if (claim == null) return NotFound();

        _db.FuelClaims.Remove(claim);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("FuelClaims", id, "DELETE", 
            new { claim.Id, claim.ShipmentId, claim.ClaimAmount, Status = claim.Status.ToString() }, 
            null, userId, GetUserName(), GetUserRole());

        return Ok(new { message = "ลบรายการเรียบร้อย" });
    }
}
