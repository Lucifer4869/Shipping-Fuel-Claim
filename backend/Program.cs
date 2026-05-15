using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ShippingAPI.Data;
using ShippingAPI.Services;

var builder = WebApplication.CreateBuilder(args); // สร้างตัว Builder สำหรับตั้งค่าแอปพลิเคชัน

// --- ส่วนการตั้งค่าฐานข้อมูล (Database) ---
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))); // เชื่อมต่อกับฐานข้อมูล PostgreSQL

// --- ส่วนการตั้งค่าระบบความปลอดภัย JWT Authentication ---
var jwtKey = builder.Configuration["Jwt:Key"]!; // ดึงรหัส Key สำหรับเข้ารหัส Token
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true, // ตรวจสอบผู้ออก Token
            ValidateAudience = true, // ตรวจสอบผู้รับ Token
            ValidateLifetime = true, // ตรวจสอบวันหมดอายุ
            ValidateIssuerSigningKey = true, // ตรวจสอบความถูกต้องของ Key
            ValidIssuer = builder.Configuration["Jwt:Issuer"], // ชื่อผู้ออก Token ที่ถูกต้อง
            ValidAudience = builder.Configuration["Jwt:Audience"], // ชื่อผู้รับ Token ที่ถูกต้อง
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)) // ใช้ Key ที่กำหนดในการยืนยันตัวตน
        };
        
        // ตั้งค่าให้ดึง Token จาก Cookie แทน Header (เพิ่มความปลอดภัย)
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (context.Request.Cookies.ContainsKey("jwtToken"))
                {
                    context.Token = context.Request.Cookies["jwtToken"];
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(); // เปิดใช้งานระบบตรวจสอบสิทธิ์ (Role-based access)

// --- ส่วนการลงทะเบียน Services (Dependency Injection) ---
builder.Services.AddScoped<JwtService>(); // ลงทะเบียนระบบสร้าง Token
builder.Services.AddScoped<AuditService>(); // ลงทะเบียนระบบบันทึกประวัติการทำงาน (Logs)

// --- ส่วนการตั้งค่า Controllers และ HttpClient ---
builder.Services.AddHttpClient(); // เปิดให้ API สามารถเรียกใช้งาน HTTP Client ได้
builder.Services.AddControllers(); // ลงทะเบียน Controller สำหรับจัดการ API Routes

// --- ส่วนการตั้งค่า CORS (เพื่อให้ Frontend เชื่อมต่อได้) ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:3000") // อนุญาต URL ของ React
              .AllowAnyHeader() // อนุญาตทุก Header
              .AllowAnyMethod() // อนุญาตทุก Method (GET, POST, etc.)
              .AllowCredentials() // อนุญาตให้ส่ง Cookie ข้ามโดเมนได้ (จำเป็นสำหรับ HttpOnly Cookie)
              .WithExposedHeaders("X-Total-Count")); // เปิดให้ Frontend อ่าน Header ตัวนี้ได้ (สำหรับ Pagination)
});

// --- ส่วนการตั้งค่า Swagger (คู่มือ API) ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Shipping Management API",
        Version = "v1",
        Description = "API สำหรับระบบจัดการการขนส่ง รองรับ Shipment, Withdrawal, FuelClaim และ AuditLog"
    });

    // ตั้งค่าให้ Swagger รองรับการใส่ Token เพื่อทดสอบ API
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "ใส่ค่า: Bearer {รหัส Token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build(); // สร้างแอปพลิเคชันจากสิ่งที่ตั้งค่าไว้ข้างบน

// ตรวจสอบและสร้างโฟลเดอร์ wwwroot ถ้ายังไม่มี (เพื่อให้ UseStaticFiles ทำงานได้ถูกต้องตั้งแต่เริ่มรัน)
var webRoot = app.Environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
if (!Directory.Exists(webRoot))
{
    Directory.CreateDirectory(webRoot);
}

// --- ส่วนการทำงานตอนเริ่มต้นแอป (Startup) ---
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate(); // สั่งให้ปรับปรุงโครงสร้างฐานข้อมูล (Migration) โดยอัตโนมัติเมื่อรันโปรแกรม

    // --- เพิ่มเติม: ตรวจสอบและซ่อมแซมค่า Hash สำหรับไฟล์ที่ยังไม่มี ---
    var filesWithoutHash = db.UploadedFiles.Where(f => string.IsNullOrEmpty(f.ContentHash)).ToList();
    if (filesWithoutHash.Any())
    {
        Console.WriteLine($"[SYSTEM] Found {filesWithoutHash.Count} files without hash. Repairing...");
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        foreach (var file in filesWithoutHash)
        {
            var hashBytes = sha256.ComputeHash(file.FileData);
            file.ContentHash = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
        }
        db.SaveChanges();
        Console.WriteLine("[SYSTEM] Hash repair completed.");
    }
}

// --- ส่วนของ Middleware (ลำดับการประมวลผล) ---
app.UseSwagger(); // เปิดใช้งาน Swagger
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Shipping API v1");
    c.RoutePrefix = string.Empty; // ตั้งค่าให้หน้าแรกของเว็บเป็น Swagger เลย
});

app.UseStaticFiles(); // อนุญาตให้เข้าถึงไฟล์ Static (เช่น รูปภาพใบเสร็จ)
app.UseCors("AllowReact"); // เรียกใช้งานการตั้งค่า CORS ที่กำหนดไว้ข้างบน
app.UseAuthentication(); // เปิดระบบตรวจสอบตัวตน (ต้องอยู่ก่อน Authorization)
app.UseAuthorization(); // เปิดระบบตรวจสอบสิทธิ์
app.MapControllers(); // เชื่อมต่อเส้นทาง API กับ Controller ต่างๆ

app.Run(); // เริ่มรันแอปพลิเคชัน
