using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShippingAPI.Data;
using ShippingAPI.DTOs;
using ShippingAPI.Services;

namespace ShippingAPI.Controllers;

[ApiController] //ตัวควบคุมสำหรับจัดการการยืนยันตัวตน
[Route("api/auth")] //เพิ่ม api นี้ด้วยgoogle login โดยใช้ token
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtService _jwtService;

    public AuthController(AppDbContext db, JwtService jwtService)
    {
        _db = db;
        _jwtService = jwtService;
    }

    private void SetTokenCookie(string token)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = false, // ถ้ารันบนเซิร์ฟเวอร์จริงที่เป็น HTTPS ควรเปลี่ยนเป็น true หรือตรวจสอบ Environment
            SameSite = SameSiteMode.Lax, // ยอมรับการทำงานแบบ Cross-Origin บน Localhost
            Expires = DateTime.UtcNow.AddDays(7)
        };
        Response.Cookies.Append("jwtToken", token, cookieOptions);
    }

    /// <summary>ล็อกอินเพื่อรับ JWT Token</summary>
    [HttpPost("login")] //
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Username == request.Username && u.IsActive);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });

        var token = _jwtService.GenerateToken(user);
        SetTokenCookie(token);

        return Ok(new LoginResponse
        {
            Token = token,
            FullName = user.FullName,
            Role = user.Role.ToString(),
            VehiclePlate = user.VehiclePlate,
            UserId = user.Id
        });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("jwtToken");
        return Ok(new { message = "ออกจากระบบเรียบร้อยแล้ว" });
    }

    [HttpPost("google-login")]//เพิ่ม api นี้ด้วยgoogle login โดยใช้ token 
    public async Task<ActionResult<LoginResponse>> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        try
        {
            var payload = await Google.Apis.Auth.GoogleJsonWebSignature.ValidateAsync(request.IdToken);

            // ตรวจสอบว่ามีผู้ใช้ในระบบที่มี Email หรือ Username ตรงกับ Google Email หรือไม่
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == payload.Email || u.Username == payload.Email);
            if (user == null)
            {
                return Unauthorized(new { message = "อีเมลนี้ไม่มีในระบบ ไม่ได้รับอนุญาตให้เข้าใช้งาน" });
            }

            if (!user.IsActive)
                return Unauthorized(new { message = "บัญชีนี้ถูกระงับการใช้งาน" });//เพิ่ม check ถ้า user ไม่ active ให้ return error

            var token = _jwtService.GenerateToken(user);
            SetTokenCookie(token);

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

    [HttpGet("me")] //เพิ่ม check ถ้า user ไม่ active ให้ return error จร้า
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
