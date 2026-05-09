namespace ShippingAPI.Models;

public class FuelClaim
{
    public int Id { get; set; }
    public int ShipmentId { get; set; }
    public decimal ClaimAmount { get; set; }
    public string? ReceiptUrl { get; set; }
    public double MileageOut { get; set; }
    public double MileageIn { get; set; }
    public FuelClaimStatus Status { get; set; } = FuelClaimStatus.Pending;
    
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
