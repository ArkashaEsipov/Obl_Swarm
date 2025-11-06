using Microsoft.AspNetCore.Mvc;
using InventoryApi.Data;
using InventoryApi.Models;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductsController(AppDbContext context)
        {
            _context = context;
        }

        // Добавляем обработку OPTIONS запросов для CORS
        [HttpOptions]
        public IActionResult Options()
        {
            Response.Headers.Add("Access-Control-Allow-Origin", "http://localhost:8080");
            Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization");
            return Ok();
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            // Добавляем CORS заголовки в ответ
            Response.Headers.Add("Access-Control-Allow-Origin", "http://localhost:8080");
            
            var products = _context.Products.ToList();
            var result = products.Select(p => new
            {
                p.Id,
                p.Name,
                p.Sku,
                p.PurchasePrice,
                p.SellPrice,
                p.Quantity,
                StockValue = p.StockValue
            });
            return Ok(result);
        }

        [HttpPost]
        public IActionResult Create([FromBody] Product product)
        {
            Response.Headers.Add("Access-Control-Allow-Origin", "http://localhost:8080");
            
            if (string.IsNullOrEmpty(product.Sku))
            {
                product.Sku = $"SKU-{DateTime.Now.Ticks}";
            }

            _context.Products.Add(product);
            _context.SaveChanges();
            return Ok(product);
        }

        // Старые методы по ID (оставляем для обратной совместимости)
        [HttpPut("{id}/receive")]
        public IActionResult ReceiveStock(int id, [FromBody] int quantity)
        {
            Response.Headers.Add("Access-Control-Allow-Origin", "http://localhost:8080");
            
            var product = _context.Products.Find(id);
            if (product == null) return NotFound();

            product.Quantity += quantity;
            _context.SaveChanges();
            return Ok(product);
        }

        [HttpPut("{id}/sell")]
        public IActionResult SellStock(int id, [FromBody] int quantity)
        {
            Response.Headers.Add("Access-Control-Allow-Origin", "http://localhost:8080");
            
            var product = _context.Products.Find(id);
            if (product == null) return NotFound();

            if (product.Quantity < quantity)
                return BadRequest("Недостаточно товара на складе");

            product.Quantity -= quantity;
            _context.SaveChanges();
            return Ok(product);
        }

        // Новые методы по артикулу
        [HttpPut("receive-by-sku/{sku}")]
        public IActionResult ReceiveStockBySku(string sku, [FromBody] int quantity)
        {
            Response.Headers.Add("Access-Control-Allow-Origin", "http://localhost:8080");
            
            var product = _context.Products.FirstOrDefault(p => p.Sku == sku);
            if (product == null) return NotFound($"Товар с артикулом '{sku}' не найден");

            product.Quantity += quantity;
            _context.SaveChanges();
            return Ok(product);
        }

        [HttpPut("sell-by-sku/{sku}")]
        public IActionResult SellStockBySku(string sku, [FromBody] int quantity)
        {
            Response.Headers.Add("Access-Control-Allow-Origin", "http://localhost:8080");
            
            var product = _context.Products.FirstOrDefault(p => p.Sku == sku);
            if (product == null) return NotFound($"Товар с артикулом '{sku}' не найден");

            if (product.Quantity < quantity)
                return BadRequest($"Недостаточно товара '{product.Name}' на складе. Доступно: {product.Quantity}");

            product.Quantity -= quantity;
            _context.SaveChanges();
            return Ok(product);
        }

        // Метод для поиска товара по артикулу (может пригодиться)
        [HttpGet("by-sku/{sku}")]
        public IActionResult GetBySku(string sku)
        {
            Response.Headers.Add("Access-Control-Allow-Origin", "http://localhost:8080");
            
            var product = _context.Products.FirstOrDefault(p => p.Sku == sku);
            if (product == null) return NotFound();

            var result = new
            {
                product.Id,
                product.Name,
                product.Sku,
                product.PurchasePrice,
                product.SellPrice,
                product.Quantity,
                StockValue = product.StockValue
            };
            return Ok(result);
        }
    }
}