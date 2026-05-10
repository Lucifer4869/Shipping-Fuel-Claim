using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ShippingAPI.Controllers;

[ApiController] //เป็นตัวจัดการการอัปโหลดไฟล์ เอาไว้อัปโหลดบิลไฟล์เอกสารต่างๆครับ
[Route("api/uploads")]
[Authorize] //ยืนยันตัวตนผู้ใช้
public class UploadsController : ControllerBase
{
    private readonly IWebHostEnvironment _env;

    public UploadsController(IWebHostEnvironment env)
    {
        _env = env;
    }

    [HttpPost] //เป็นตัวจัดการการอัปโหลดไฟล์
    public async Task<IActionResult> UploadFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded" });

        // Ensure wwwroot/uploads directory exists
        var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
        if (!Directory.Exists(uploadsFolder))
            Directory.CreateDirectory(uploadsFolder);

        // Generate unique filename
        var fileExtension = Path.GetExtension(file.FileName);
        var uniqueFileName = Guid.NewGuid().ToString() + fileExtension;
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        // Save file
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Return URL (relative to root)
        var fileUrl = $"/uploads/{uniqueFileName}";
        return Ok(new { url = fileUrl });
    }
}
