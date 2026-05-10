using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShippingAPI.Data;
using ShippingAPI.DTOs;

namespace ShippingAPI.Controllers;

[ApiController]//เป็นระบบ เอาไว้ดูประวัติเพื่อดูการทำงานข้อง แต่ละ role
[Route("api/audit-logs")]
[Authorize(Roles = "Admin")] //ใช้ได้เฉพาะ admin
public class AuditLogsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AuditLogsController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>ดูประวัติการแก้ไขทั้งหมด (Admin เท่านั้น)</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AuditLogDto>>> GetAuditLogs(
        [FromQuery] string? tableName,
        [FromQuery] string? action,
        [FromQuery] string? performedByRole,
        [FromQuery] string? performedByName,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _db.AuditLogs.AsQueryable();

        if (!string.IsNullOrEmpty(tableName))
            query = query.Where(a => a.TableName == tableName);
        if (!string.IsNullOrEmpty(action))
            query = query.Where(a => a.Action == action);
        
        // กรองด้วย Role
        if (!string.IsNullOrEmpty(performedByRole))
            query = query.Where(a => a.PerformedByRole == performedByRole);
        
        // กรองด้วยชื่อ (ใช้ ILike ของ PostgreSQL เพื่อรองรับภาษาไทยและการค้นหาที่แม่นยำ)
        if (!string.IsNullOrEmpty(performedByName))
        {
            var search = $"%{performedByName.Trim()}%";
            query = query.Where(a => EF.Functions.ILike(a.PerformedByName, search));
        }

        if (from.HasValue)
            query = query.Where(a => a.CreatedAt >= from.Value);
        if (to.HasValue)
            query = query.Where(a => a.CreatedAt <= to.Value);

        var total = await query.CountAsync();
        var logs = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogDto
            {
                Id = a.Id,
                TableName = a.TableName,
                RecordId = a.RecordId,
                Action = a.Action,
                OldValue = a.OldValue,
                NewValue = a.NewValue,
                PerformedByName = a.PerformedByName,
                PerformedByRole = a.PerformedByRole,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();

        Response.Headers.Append("X-Total-Count", total.ToString());
        return Ok(logs);
    }
}
