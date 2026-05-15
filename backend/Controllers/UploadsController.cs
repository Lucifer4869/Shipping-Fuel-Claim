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
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf" }; //กำหนดนามสกุลไฟล์ที่อนุญาต
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(extension) || !allowedExtensions.Contains(extension))
            return BadRequest(new { message = "อนุญาตเฉพาะไฟล์รูปภาพ (jpg, png) หรือ PDF เท่านั้น" });

        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream);
        var fileData = memoryStream.ToArray();

        // Calculate SHA256 Hash to check for duplicates
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var hashBytes = sha256.ComputeHash(fileData);
        var contentHash = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();

        Console.WriteLine($"[DEBUG] Uploading file: {file.FileName}, Hash: {contentHash}");

        try 
        {
            // Check if file already exists
            var existingFile = await _db.UploadedFiles
                .FirstOrDefaultAsync(f => f.ContentHash == contentHash);

            if (existingFile != null)
            {
                Console.WriteLine($"[DEBUG] Duplicate found! Existing File ID: {existingFile.Id}");
                return Ok(new { url = $"/api/uploads/{existingFile.Id}", isDuplicate = true });
            }
            
            Console.WriteLine("[DEBUG] No duplicate found. Saving new file...");

            var uploadedFile = new UploadedFile
            {
                Id = Guid.NewGuid(),
                FileName = file.FileName,
                ContentType = file.ContentType,
                FileData = fileData,
                ContentHash = contentHash
            };

            _db.UploadedFiles.Add(uploadedFile);
            await _db.SaveChangesAsync();

            var fileUrl = $"/api/uploads/{uploadedFile.Id}";
            return Ok(new { url = fileUrl, isDuplicate = false });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] Upload failed: {ex.Message}");
            return BadRequest(new { message = $"เกิดข้อผิดพลาดในการบันทึกไฟล์: {ex.Message}" });
        }
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
