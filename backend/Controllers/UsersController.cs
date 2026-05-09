using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShippingAPI.Data;
using ShippingAPI.DTOs;
using ShippingAPI.Models;
using ShippingAPI.Services;

namespace ShippingAPI.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuditService _audit;

    public UsersController(AppDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    private int GetUserId() => int.Parse(User.FindFirstValue("userId")!);
    private string GetUserName() => User.FindFirstValue("fullName") ?? "";
    private string GetUserRole() => User.FindFirstValue(ClaimTypes.Role) ?? "";

    /// <summary>ดูรายการผู้ใช้ทั้งหมด</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
    {
        var users = await _db.Users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                FullName = u.FullName,
                Role = u.Role.ToString(),
                VehiclePlate = u.VehiclePlate,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return Ok(users);
    }

    /// <summary>เพิ่มผู้ใช้ใหม่</summary>
    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Username == request.Username))
            return BadRequest(new { message = "ชื่อผู้ใช้นี้มีในระบบแล้ว" });

        if (!Enum.TryParse<UserRole>(request.Role, true, out var roleEnum))
            return BadRequest(new { message = "Role ไม่ถูกต้อง (Driver, Manager, Finance, Admin)" });

        var user = new User
        {
            Username = request.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName,
            Role = roleEnum,
            VehiclePlate = request.VehiclePlate ?? "",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var requestToLog = new { request.Username, request.FullName, request.Role, request.VehiclePlate };
        await _audit.LogAsync("Users", user.Id, "CREATE", null, requestToLog, GetUserId(), GetUserName(), GetUserRole());

        return CreatedAtAction(nameof(GetUsers), null, new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            FullName = user.FullName,
            Role = user.Role.ToString(),
            VehiclePlate = user.VehiclePlate,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        });
    }

    /// <summary>แก้ไขผู้ใช้</summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        var oldValues = new { user.FullName, Role = user.Role.ToString(), user.VehiclePlate, user.IsActive };

        if (!string.IsNullOrEmpty(request.FullName)) user.FullName = request.FullName;
        if (!string.IsNullOrEmpty(request.Password)) user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        if (request.VehiclePlate != null) user.VehiclePlate = request.VehiclePlate;
        if (request.IsActive.HasValue) user.IsActive = request.IsActive.Value;
        
        if (!string.IsNullOrEmpty(request.Role))
        {
            if (!Enum.TryParse<UserRole>(request.Role, true, out var roleEnum))
                return BadRequest(new { message = "Role ไม่ถูกต้อง" });
            user.Role = roleEnum;
        }

        await _db.SaveChangesAsync();
        
        var newValues = new { user.FullName, Role = user.Role.ToString(), user.VehiclePlate, user.IsActive };
        await _audit.LogAsync("Users", id, "UPDATE", oldValues, newValues, GetUserId(), GetUserName(), GetUserRole());

        return NoContent();
    }

    /// <summary>ลบผู้ใช้ (Admin เท่านั้น)</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        if (id == 1) return BadRequest(new { message = "ไม่สามารถลบ Admin หลักของระบบได้" }); // Protect initial admin

        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        await _audit.LogAsync("Users", id, "DELETE", new { user.Username, user.FullName }, null, GetUserId(), GetUserName(), GetUserRole());

        return NoContent();
    }
}
