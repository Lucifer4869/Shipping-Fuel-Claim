using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShippingAPI.Data;
using ShippingAPI.DTOs;

namespace ShippingAPI.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize(Roles = "Admin")]
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
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();

        Response.Headers.Append("X-Total-Count", total.ToString());
        return Ok(logs);
    }
}
