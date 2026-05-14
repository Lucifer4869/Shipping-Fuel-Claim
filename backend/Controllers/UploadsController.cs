using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShippingAPI.Data;
using ShippingAPI.Models;

namespace ShippingAPI.Controllers;

[ApiController] //เป็นตัวจัดการการอัปโหลดไฟล์ เอาไว้อัปโหลดบิลไฟล์เอกสารต่างๆครับ
[Route("api/uploads")]
[Authorize] //ยืนยันตัวตนผู้ใช้
public class UploadsController : ControllerBase
{
    private readonly AppDbContext _db;

    public UploadsController(AppDbContext db) //IWebHostEnvironment เป็นตัวจัดการการอัปโหลดไฟล์
    {
        _db = db;//บันทึกข้อมูลลงฐานข้อมูล
    }

    [HttpPost] //เป็นตัวจัดการการอัปโหลดไฟล์
    public async Task<IActionResult> UploadFile(IFormFile file)//อัปโหลดไฟล์
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "กรุณาเลือกไฟล์ที่ต้องการอัปโหลด" });

        // Validate File Size (Max 5MB)
        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { message = "ขนาดไฟล์ต้องไม่เกิน 5MB" });

        // Validate File Extension
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(extension) || !allowedExtensions.Contains(extension))
            return BadRequest(new { message = "อนุญาตเฉพาะไฟล์รูปภาพ (jpg, png) หรือ PDF เท่านั้น" });

        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream);

        var uploadedFile = new UploadedFile
        {
            Id = Guid.NewGuid(),
            FileName = file.FileName,
            ContentType = file.ContentType,
            FileData = memoryStream.ToArray()
        };

        _db.UploadedFiles.Add(uploadedFile);
        await _db.SaveChangesAsync();

        // Return URL to access this file via GetFile
        var fileUrl = $"/api/uploads/{uploadedFile.Id}";
        return Ok(new { url = fileUrl });
    }

    [HttpGet("{id}")]
    [AllowAnonymous] // อนุญาตให้ดึงรูปไปแสดงได้โดยไม่ต้องแนบ Token ในแท็ก img
    public async Task<IActionResult> GetFile(Guid id)
    {
        var file = await _db.UploadedFiles.FindAsync(id);
        if (file == null)
            return NotFound();

        return File(file.FileData, file.ContentType);
    }
}
