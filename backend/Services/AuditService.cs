using System.Text.Json;
using ShippingAPI.Data;
using ShippingAPI.Models;

namespace ShippingAPI.Services;

public class AuditService //ระบบตรวจสอบการทำงานของผ้ใช้ในแอปพลิเคชันของเรา
{
    private readonly AppDbContext _db; //สร้างตัวเชื่อมต่อฐานข้อมูล

    public AuditService(AppDbContext db) //ตัวเชื่อมต่อฐานข้อมูล
    { 
        _db = db; //เชื่อมต่อฐานข้อมูล
    }

    public async Task LogAsync(
        string tableName,
        int recordId,
        string action,
        object? oldValue,
        object? newValue,
        int performedById,
        string performedByName,
        string performedByRole)
    {
        var log = new AuditLog //สร้างตาราง Log
        {
            TableName = tableName,
            RecordId = recordId,
            Action = action,
            OldValue = oldValue != null ? JsonSerializer.Serialize(oldValue) : null,
            NewValue = newValue != null ? JsonSerializer.Serialize(newValue) : null,
            PerformedById = performedById,
            PerformedByName = performedByName,
            PerformedByRole = performedByRole,
            CreatedAt = DateTime.UtcNow
        };

        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync();
    }
}
