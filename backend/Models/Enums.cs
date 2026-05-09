namespace ShippingAPI.Models;

public enum UserRole
{
    Driver = 0,
    Manager = 1,
    Finance = 2,
    Admin = 3
}

public enum ShipmentStatus
{
    Active = 0,
    Completed = 1,
    Cancelled = 2
}

public enum WithdrawalStatus
{
    Pending = 0,
    ApprovedByManager = 1,
    ApprovedByFinance = 2,
    Rejected = 3
}

public enum FuelClaimStatus
{
    Pending = 0,
    ApprovedByManager = 1,
    ApprovedByFinance = 2,
    Rejected = 3
}
