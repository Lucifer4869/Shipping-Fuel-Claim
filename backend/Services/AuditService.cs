using System.Text.Json;
using ShippingAPI.Data;
using ShippingAPI.Models;

namespace ShippingAPI.Services;

public class AuditService
{
    private readonly AppDbContext _db;

    public AuditService(AppDbContext db)
    {
        _db = db;
    }

    public async Task LogAsync(
        string tableName,
        int recordId,
        string action,
        object? oldValue,
        object? newValue,
        int performedById,
        string performedByName)
    {
        var log = new AuditLog
        {
            TableName = tableName,
            RecordId = recordId,
            Action = action,
            OldValue = oldValue != null ? JsonSerializer.Serialize(oldValue) : null,
            NewValue = newValue != null ? JsonSerializer.Serialize(newValue) : null,
            PerformedById = performedById,
            PerformedByName = performedByName,
            CreatedAt = DateTime.UtcNow
        };

        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync();
    }
}
