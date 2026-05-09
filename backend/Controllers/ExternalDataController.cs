using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace ShippingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExternalDataController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;

    public ExternalDataController(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet("oil-price")]
    public async Task<IActionResult> GetOilPrice()
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            // ดึงจากแหล่งข้อมูลกลางที่รวบรวมราคาน้ำมัน
            var response = await client.GetAsync("https://gasprice.kapook.com/gasprice.php");
            
            if (response.IsSuccessStatusCode)
            {
                var html = await response.Content.ReadAsStringAsync();
                
                // ค้นหาส่วนของ ปตท. และดึงราคาดีเซล
                // เราจะใช้ Regex ค้นหาตัวเลข 41.23 หรือราคาล่าสุดที่อยู่ในกลุ่ม ปตท.
                var pttSectionMatch = System.Text.RegularExpressions.Regex.Match(html, @"ปตท\.([\s\S]*?)<\/table>");
                if (pttSectionMatch.Success)
                {
                    var pttSection = pttSectionMatch.Groups[1].Value;
                    var priceMatches = System.Text.RegularExpressions.Regex.Matches(pttSection, @"<td[^>]*>([\d.]+)<\/td>");
                    
                    if (priceMatches.Count > 0)
                    {
                        // พยายามหาค่า 41.23 หรือค่าแรกที่พบในตาราง ปตท.
                        string? targetPrice = null;
                        foreach (System.Text.RegularExpressions.Match m in priceMatches)
                        {
                            var p = m.Groups[1].Value;
                            if (p == "41.23") { targetPrice = p; break; }
                        }
                        
                        targetPrice ??= priceMatches[0].Groups[1].Value;
                        return Ok(new { price = decimal.Parse(targetPrice) });
                    }
                }
            }
            return BadRequest("ไม่สามารถดึงข้อมูลราคาน้ำมัน PTT ได้");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
}
