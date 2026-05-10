using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using ShippingAPI.Models;

namespace ShippingAPI.Services;

public class JwtService //ส่วนของการสร้าง token สำหรับการยืนยันตัวตน
{
    private readonly IConfiguration _config;//เป็นคลาสสำหรับอ่านค่าการตั้งค่าต่างๆจากไฟล์ appsettings.json

    public JwtService(IConfiguration config)
    {
        _config = config;//อ่านค่าการตั้งค่าต่างๆจากไฟล์ appsettings.json
    }

    public string GenerateToken(User user) //ส่วนของการสร้าง token
    {
        var jwtKey = _config["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured"); //อ่านค่า key จาก appsettings.json
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)); //แปลง key เป็น byte array
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256); //สร้าง credentials

        var claims = new[] //สร้าง claims
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim("fullName", user.FullName),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("userId", user.Id.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
