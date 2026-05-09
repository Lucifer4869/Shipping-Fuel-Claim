namespace ShippingAPI.Models;

public class Shipment
{
    public int Id { get; set; }
    public string TripNumber { get; set; } = string.Empty;
    public string VehiclePlate { get; set; } = string.Empty;
    public int DriverId { get; set; }
    public string Origin { get; set; } = string.Empty;
    public double? OriginLat { get; set; }
    public double? OriginLng { get; set; }
    public string Destination { get; set; } = string.Empty;
    public double? DestinationLat { get; set; }
    public double? DestinationLng { get; set; }
    public double? RouteDistanceKm { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string SenderPhone { get; set; } = string.Empty;
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverPhone { get; set; } = string.Empty;
    public double StartMileage { get; set; }
    public double? EndMileage { get; set; }
    public ShipmentStatus Status { get; set; } = ShipmentStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public User Driver { get; set; } = null!;
    public ICollection<Withdrawal> Withdrawals { get; set; } = new List<Withdrawal>();
    public ICollection<FuelClaim> FuelClaims { get; set; } = new List<FuelClaim>();
}
