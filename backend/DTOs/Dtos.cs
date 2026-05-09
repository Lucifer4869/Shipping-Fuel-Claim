using System.ComponentModel.DataAnnotations;

namespace ShippingAPI.DTOs;

// Auth
public class LoginRequest
{
    [Required] public string Username { get; set; } = string.Empty;
    [Required] public string Password { get; set; } = string.Empty;
}

public class GoogleLoginRequest
{
    [Required] public string IdToken { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int UserId { get; set; }
}

// Shipment
public class CreateShipmentRequest
{
    [Required] public string VehiclePlate { get; set; } = string.Empty;
    [Required] public string Origin { get; set; } = string.Empty;
    public double? OriginLat { get; set; }
    public double? OriginLng { get; set; }
    [Required] public string Destination { get; set; } = string.Empty;
    public double? DestinationLat { get; set; }
    public double? DestinationLng { get; set; }
    public double? RouteDistanceKm { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string SenderPhone { get; set; } = string.Empty;
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverPhone { get; set; } = string.Empty;
    [Required] public double StartMileage { get; set; }
}

public class UpdateShipmentRequest
{
    public string VehiclePlate { get; set; } = string.Empty;
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
    public double? StartMileage { get; set; }
}

public class ShipmentDto
{
    public int Id { get; set; }
    public string TripNumber { get; set; } = string.Empty;
    public string VehiclePlate { get; set; } = string.Empty;
    public string DriverName { get; set; } = string.Empty;
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
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int WithdrawalCount { get; set; }
    public int FuelClaimCount { get; set; }
}

// Withdrawal
public class CreateWithdrawalRequest
{
    [Required] public int ShipmentId { get; set; }
    [Required][Range(1, double.MaxValue)] public decimal Amount { get; set; }
    [Required] public string Reason { get; set; } = string.Empty;
    public string? AdditionalItems { get; set; }
}

public class ApproveWithdrawalRequest
{
    [Required] public bool IsApproved { get; set; }
    public string? Note { get; set; }
}

public class WithdrawalDto
{
    public int Id { get; set; }
    public int ShipmentId { get; set; }
    public string TripNumber { get; set; } = string.Empty;
    public string DriverName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? AdditionalItems { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ManagerName { get; set; }
    public string? ManagerNote { get; set; }
    public DateTime? ManagerApprovedAt { get; set; }
    public string? FinanceName { get; set; }
    public string? FinanceNote { get; set; }
    public DateTime? FinanceApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

// FuelClaim
public class CreateFuelClaimRequest
{
    [Required] public int ShipmentId { get; set; }
    [Required][Range(1, double.MaxValue)] public decimal ClaimAmount { get; set; }
    public string? ReceiptUrl { get; set; }
    [Required] public double MileageOut { get; set; }
    [Required] public double MileageIn { get; set; }
}

public class ApproveFuelClaimRequest
{
    [Required] public bool IsApproved { get; set; }
    public string? Note { get; set; }
}

public class FuelClaimDto
{
    public int Id { get; set; }
    public int ShipmentId { get; set; }
    public string TripNumber { get; set; } = string.Empty;
    public string DriverName { get; set; } = string.Empty;
    public decimal ClaimAmount { get; set; }
    public string? ReceiptUrl { get; set; }
    public double MileageOut { get; set; }
    public double MileageIn { get; set; }
    public double Distance => MileageIn - MileageOut;
    public string Status { get; set; } = string.Empty;
    public string? ManagerName { get; set; }
    public string? ManagerNote { get; set; }
    public DateTime? ManagerApprovedAt { get; set; }
    public string? FinanceName { get; set; }
    public string? FinanceNote { get; set; }
    public DateTime? FinanceApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

// AuditLog
public class AuditLogDto
{
    public int Id { get; set; }
    public string TableName { get; set; } = string.Empty;
    public int RecordId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string PerformedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

// User Management
public class CreateUserRequest
{
    [Required] public string Username { get; set; } = string.Empty;
    [Required] public string Password { get; set; } = string.Empty;
    [Required] public string FullName { get; set; } = string.Empty;
    [Required] public string Role { get; set; } = string.Empty;
    public string VehiclePlate { get; set; } = string.Empty;
}

public class UpdateUserRequest
{
    public string? FullName { get; set; }
    public string? Role { get; set; }
    public string? Password { get; set; }
    public string? VehiclePlate { get; set; }
    public bool? IsActive { get; set; }
}

public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string VehiclePlate { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
