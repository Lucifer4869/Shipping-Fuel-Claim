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
            // ดึงจากบางจากเพราะเป็น JSON ที่เสถียรที่สุด
            var response = await client.GetAsync("https://oil-price.bangchak.co.th/ApiOilPrice2/th");
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var data = JsonSerializer.Deserialize<JsonElement>(content);
                
                if (data.ValueKind == JsonValueKind.Array && data.GetArrayLength() > 0)
                {
                    var oilListStr = data[0].GetProperty("OilList").GetString();
                    var oilList = JsonSerializer.Deserialize<JsonElement>(oilListStr!);
                    
                    // หา Diesel ปกติ
                    foreach (var oil in oilList.EnumerateArray())
                    {
                        var name = oil.GetProperty("OilName").GetString();
                        if (name != null && name.Contains("ดีเซล") && !name.Contains("พรีเมียม") && !name.Contains("B20"))
                        {
                            return Ok(new { price = oil.GetProperty("PriceToday").GetDecimal() });
                        }
                    }
                }
            }
            return BadRequest("ไม่สามารถดึงข้อมูลราคาน้ำมันได้");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
}
