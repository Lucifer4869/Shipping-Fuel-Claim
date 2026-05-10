using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShippingAPI.Data;
using ShippingAPI.DTOs;
using ShippingAPI.Services;

namespace ShippingAPI.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtService _jwtService;

    public AuthController(AppDbContext db, JwtService jwtService)
    {
        _db = db;
        _jwtService = jwtService;
    }

    /// <summary>ล็อกอินเพื่อรับ JWT Token</summary>
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Username == request.Username && u.IsActive);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });

        var token = _jwtService.GenerateToken(user);

        return Ok(new LoginResponse
        {
            Token = token,
            FullName = user.FullName,
            Role = user.Role.ToString(),
            VehiclePlate = user.VehiclePlate,
            UserId = user.Id
        });
    }
    [HttpPost("google-login")]//เพิ่ม api นี้ด้วยgoogle login โดยใช้ token 
    public async Task<ActionResult<LoginResponse>> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        try
        {
            var payload = await Google.Apis.Auth.GoogleJsonWebSignature.ValidateAsync(request.IdToken);

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == payload.Email);
            if (user == null)
            {
                return Unauthorized(new { message = "อีเมลนี้ไม่มีในระบบ ไม่ได้รับอนุญาตให้เข้าใช้งาน" });
            }

            if (!user.IsActive)
                return Unauthorized(new { message = "บัญชีนี้ถูกระงับการใช้งาน" });//เพิ่ม check ถ้า user ไม่ active ให้ return error

            var token = _jwtService.GenerateToken(user);
            return Ok(new LoginResponse
            {
                Token = token,
                FullName = user.FullName,
                Role = user.Role.ToString(),
                VehiclePlate = user.VehiclePlate,
                UserId = user.Id
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Invalid Google token", error = ex.Message });
        }
    }

    [HttpGet("me")] //เพิ่ม check ถ้า user ไม่ active ให้ return error จร้าาาา
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<ActionResult> GetMe()
    {
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();

        return Ok(new
        {
            UserId = user.Id,
            FullName = user.FullName,
            Role = user.Role.ToString(),
            VehiclePlate = user.VehiclePlate
        });
    }
}
