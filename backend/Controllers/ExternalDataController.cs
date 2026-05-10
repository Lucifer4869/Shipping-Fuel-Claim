using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace ShippingAPI.Controllers;

[ApiController] // controller สำหรับดึงข้อมูลจากภายนอก ครับ
[Route("api/[controller]")]
public class ExternalDataController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;

    public ExternalDataController(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet("oil-price")] //api นี้ได้ราคาน้ำมันดีเซลจากเว็บ kapook ครับผม เพื่อให้ตรงกับข้อมูลราคากับปัจจุบัน
    public async Task<IActionResult> GetOilPrice()
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync("https://gasprice.kapook.com/gasprice.php");
            
            if (response.IsSuccessStatusCode)
            {
                var html = await response.Content.ReadAsStringAsync();
                
                // ค้นหาในส่วน <article class="gasprice ptt">
                var pttSectionMatch = System.Text.RegularExpressions.Regex.Match(html, @"<article class=""gasprice ptt"">([\s\S]*?)<\/article>");
                if (pttSectionMatch.Success)
                {
                    var pttSection = pttSectionMatch.Groups[1].Value;
                    // หาค่าราคาน้ำมันดีเซล <li><span>ดีเซล</span><em>([\d.]+)</em></li>
                    var priceMatch = System.Text.RegularExpressions.Regex.Match(pttSection, @"ดีเซล<\/span><em>([\d.]+)<\/em>");
                    
                    if (priceMatch.Success)
                    {
                        var targetPrice = priceMatch.Groups[1].Value;
                        return Ok(new { price = decimal.Parse(targetPrice) });
                    }
                }
            }
            return BadRequest("ไม่สามารถดึงข้อมูลราคาน้ำมัน PTT จาก Kapook ได้");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
}
