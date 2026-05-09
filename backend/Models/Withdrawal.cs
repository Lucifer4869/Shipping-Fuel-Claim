namespace ShippingAPI.Models;

public class Withdrawal
{
    public int Id { get; set; }
    public int ShipmentId { get; set; }
    public decimal Amount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? AdditionalItems { get; set; }
    public WithdrawalStatus Status { get; set; } = WithdrawalStatus.Pending;
    public int? ManagerId { get; set; }
    public string? ManagerNote { get; set; }
    public DateTime? ManagerApprovedAt { get; set; }
    public int? FinanceId { get; set; }
    public string? FinanceNote { get; set; }
    public DateTime? FinanceApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public Shipment Shipment { get; set; } = null!;
    public User? Manager { get; set; }
    public User? Finance { get; set; }
}
