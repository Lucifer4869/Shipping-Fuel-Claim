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
[Route("api/shipments")]
[Authorize]
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

    /// <summary>ดูรายการเดินรถทั้งหมด (Admin/Manager/Finance เห็นทั้งหมด, Driver เห็นเฉพาะของตัวเอง)</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ShipmentDto>>> GetShipments()
    {
        var userId = GetUserId();
        var role = User.FindFirstValue(ClaimTypes.Role);

        var query = _db.Shipments
            .Include(s => s.Driver)
            .Include(s => s.Withdrawals)
            .Include(s => s.FuelClaims)
            .AsQueryable();

        if (role == "Driver")
            query = query.Where(s => s.DriverId == userId);

        var shipments = await query
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new ShipmentDto
            {
                Id = s.Id,
                TripNumber = s.TripNumber,
                VehiclePlate = s.VehiclePlate,
                DriverName = s.Driver.FullName,
                Origin = s.Origin,
                OriginLat = s.OriginLat,
                OriginLng = s.OriginLng,
                Destination = s.Destination,
                DestinationLat = s.DestinationLat,
                DestinationLng = s.DestinationLng,
                RouteDistanceKm = s.RouteDistanceKm,
                SenderName = s.SenderName,
                SenderPhone = s.SenderPhone,
                ReceiverName = s.ReceiverName,
                ReceiverPhone = s.ReceiverPhone,
                StartMileage = s.StartMileage,
                EndMileage = s.EndMileage,
                Status = s.Status.ToString(),
                CreatedAt = s.CreatedAt,
                WithdrawalCount = s.Withdrawals.Count,
                FuelClaimCount = s.FuelClaims.Count
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

        var s = await _db.Shipments
            .Include(s => s.Driver)
            .Include(s => s.Withdrawals)
            .Include(s => s.FuelClaims)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (s == null) return NotFound();
        if (role == "Driver" && s.DriverId != userId) return Forbid();

        return Ok(new ShipmentDto
        {
            Id = s.Id,
            TripNumber = s.TripNumber,
            VehiclePlate = s.VehiclePlate,
            DriverName = s.Driver.FullName,
            Origin = s.Origin,
            Destination = s.Destination,
            StartMileage = s.StartMileage,
            EndMileage = s.EndMileage,
            Status = s.Status.ToString(),
            CreatedAt = s.CreatedAt,
            WithdrawalCount = s.Withdrawals.Count,
            FuelClaimCount = s.FuelClaims.Count
        });
    }

    /// <summary>สร้างเลขที่เดินรถใหม่ (Driver เท่านั้น)</summary>
    [HttpPost]
    [Authorize(Roles = "Driver,Admin")]
    public async Task<ActionResult<ShipmentDto>> CreateShipment([FromBody] CreateShipmentRequest request)
    {
        var userId = GetUserId();
        var tripNumber = $"TRP-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";

        var shipment = new Shipment
        {
            TripNumber = tripNumber,
            VehiclePlate = request.VehiclePlate,
            DriverId = userId,
            Origin = request.Origin,
            OriginLat = request.OriginLat,
            OriginLng = request.OriginLng,
            Destination = request.Destination,
            DestinationLat = request.DestinationLat,
            DestinationLng = request.DestinationLng,
            RouteDistanceKm = request.RouteDistanceKm,
            SenderName = request.SenderName,
            SenderPhone = request.SenderPhone,
            ReceiverName = request.ReceiverName,
            ReceiverPhone = request.ReceiverPhone,
            StartMileage = request.StartMileage,
            CreatedAt = DateTime.UtcNow
        };

        _db.Shipments.Add(shipment);
        await _db.SaveChangesAsync();

        await _audit.LogAsync("Shipments", shipment.Id, "CREATE", null, request, userId, GetUserName());

        var driver = await _db.Users.FindAsync(userId);
        return CreatedAtAction(nameof(GetShipment), new { id = shipment.Id }, new ShipmentDto
        {
            Id = shipment.Id,
            TripNumber = shipment.TripNumber,
            VehiclePlate = shipment.VehiclePlate,
            DriverName = driver?.FullName ?? "",
            Origin = shipment.Origin,
            OriginLat = shipment.OriginLat,
            OriginLng = shipment.OriginLng,
            Destination = shipment.Destination,
            DestinationLat = shipment.DestinationLat,
            DestinationLng = shipment.DestinationLng,
            RouteDistanceKm = shipment.RouteDistanceKm,
            SenderName = shipment.SenderName,
            SenderPhone = shipment.SenderPhone,
            ReceiverName = shipment.ReceiverName,
            ReceiverPhone = shipment.ReceiverPhone,
            StartMileage = shipment.StartMileage,
            Status = shipment.Status.ToString(),
            CreatedAt = shipment.CreatedAt
        });
    }

    /// <summary>อัปเดตข้อมูลเดินรถ</summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Driver,Admin")]
    public async Task<IActionResult> UpdateShipment(int id, [FromBody] UpdateShipmentRequest request)
    {
        var userId = GetUserId();
        var role = User.FindFirstValue(ClaimTypes.Role);
        var shipment = await _db.Shipments.FindAsync(id);

        if (shipment == null) return NotFound();
        if (role == "Driver" && shipment.DriverId != userId) return Forbid();
        if (shipment.Status != ShipmentStatus.Active && role != "Admin") 
            return BadRequest(new { message = "ไม่สามารถแก้ไขการเดินรถที่เสร็จสิ้นหรือยกเลิกแล้วได้" });

        var oldValues = new { 
            shipment.VehiclePlate, shipment.Origin, shipment.Destination, 
            shipment.SenderName, shipment.SenderPhone, shipment.ReceiverName, shipment.ReceiverPhone,
            shipment.StartMileage 
        };

        if (!string.IsNullOrEmpty(request.VehiclePlate)) shipment.VehiclePlate = request.VehiclePlate;
        if (!string.IsNullOrEmpty(request.Origin)) shipment.Origin = request.Origin;
        if (request.OriginLat.HasValue) shipment.OriginLat = request.OriginLat;
        if (request.OriginLng.HasValue) shipment.OriginLng = request.OriginLng;
        if (!string.IsNullOrEmpty(request.Destination)) shipment.Destination = request.Destination;
        if (request.DestinationLat.HasValue) shipment.DestinationLat = request.DestinationLat;
        if (request.DestinationLng.HasValue) shipment.DestinationLng = request.DestinationLng;
        if (request.RouteDistanceKm.HasValue) shipment.RouteDistanceKm = request.RouteDistanceKm;
        
        if (request.SenderName != null) shipment.SenderName = request.SenderName;
        if (request.SenderPhone != null) shipment.SenderPhone = request.SenderPhone;
        if (request.ReceiverName != null) shipment.ReceiverName = request.ReceiverName;
        if (request.ReceiverPhone != null) shipment.ReceiverPhone = request.ReceiverPhone;
        
        if (request.StartMileage.HasValue) shipment.StartMileage = request.StartMileage.Value;

        shipment.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var newValues = new { 
            shipment.VehiclePlate, shipment.Origin, shipment.Destination, 
            shipment.SenderName, shipment.SenderPhone, shipment.ReceiverName, shipment.ReceiverPhone,
            shipment.StartMileage 
        };
        await _audit.LogAsync("Shipments", id, "UPDATE", oldValues, newValues, userId, GetUserName());

        return NoContent();
    }

    /// <summary>อัปเดตสถานะเดินรถ</summary>
    [HttpPatch("{id}/complete")]
    [Authorize(Roles = "Driver,Admin")]
    public async Task<IActionResult> CompleteShipment(int id, [FromBody] double endMileage)
    {
        var userId = GetUserId();
        var shipment = await _db.Shipments.FindAsync(id);

        if (shipment == null) return NotFound();
        if (shipment.DriverId != userId) return Forbid();
        if (shipment.Status != ShipmentStatus.Active) return BadRequest(new { message = "การเดินรถนี้ไม่ได้อยู่ในสถานะ Active" });

        var oldStatus = shipment.Status;
        shipment.Status = ShipmentStatus.Completed;
        shipment.EndMileage = endMileage;
        shipment.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _audit.LogAsync("Shipments", id, "UPDATE",
            new { Status = oldStatus.ToString() },
            new { Status = "Completed", EndMileage = endMileage },
            userId, GetUserName());

        return NoContent();
    }

    /// <summary>ลบข้อมูลการเดินรถ (Admin เท่านั้น)</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteShipment(int id)
    {
        var shipment = await _db.Shipments
            .Include(s => s.Withdrawals)
            .Include(s => s.FuelClaims)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (shipment == null) return NotFound();

        // Remove associated records first to avoid foreign key violations
        if (shipment.Withdrawals.Any())
            _db.Withdrawals.RemoveRange(shipment.Withdrawals);
        
        if (shipment.FuelClaims.Any())
            _db.FuelClaims.RemoveRange(shipment.FuelClaims);

        _db.Shipments.Remove(shipment);
        await _db.SaveChangesAsync();

        await _audit.LogAsync("Shipments", id, "DELETE", new { shipment.TripNumber }, null, GetUserId(), GetUserName());

        return NoContent();
    }
}
