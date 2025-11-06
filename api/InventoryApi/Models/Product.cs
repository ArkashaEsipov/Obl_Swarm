namespace InventoryApi.Models
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Sku { get; set; } = string.Empty;
        public decimal PurchasePrice { get; set; }
        public decimal SellPrice { get; set; }
        public int Quantity { get; set; }

        public decimal StockValue => PurchasePrice * Quantity;
    }
}
