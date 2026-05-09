namespace ShippingAPI.Models;

public class AuditLog
{
    public int Id { get; set; }
    public string TableName { get; set; } = string.Empty;
    public int RecordId { get; set; }
    public string Action { get; set; } = string.Empty; // CREATE, UPDATE, DELETE
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public int PerformedById { get; set; }
    public string PerformedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User PerformedBy { get; set; } = null!;
}
