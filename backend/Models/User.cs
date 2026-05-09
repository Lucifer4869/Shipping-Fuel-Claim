namespace ShippingAPI.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string VehiclePlate { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Shipment> Shipments { get; set; } = new List<Shipment>();
    public ICollection<Withdrawal> ApprovedWithdrawals { get; set; } = new List<Withdrawal>();
}
