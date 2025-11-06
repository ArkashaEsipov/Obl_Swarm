using InventoryApi.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Добавляем CORS для разрешения запросов от фронтенда
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:8080", "http://localhost:8081")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? "Server=db;Database=inventory;User=root;Password=secret;";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Используем CORS ДО других middleware
app.UseCors();

// ✅ Простая инициализация базы данных
async Task InitializeDatabaseAsync(IServiceProvider services)
{
    using var scope = services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    
    // Ждем пока база данных станет доступной
    for (int i = 0; i < 10; i++)
    {
        try
        {
            if (await db.Database.CanConnectAsync())
            {
                Console.WriteLine("✅ Подключение к базе данных успешно!");
                break;
            }
        }
        catch
        {
            if (i == 9) throw;
            await Task.Delay(5000);
        }
    }
    
    // Создаем таблицу через EnsureCreated
    var created = await db.Database.EnsureCreatedAsync();
    Console.WriteLine($"✅ База данных создана: {created}");
    
    // Добавляем тестовые данные
    if (!db.Products.Any())
    {
        db.Products.AddRange(
            new InventoryApi.Models.Product { Name = "Товар 1", Sku = "SKU-001", PurchasePrice = 10, SellPrice = 15, Quantity = 5 },
            new InventoryApi.Models.Product { Name = "Товар 2", Sku = "SKU-002", PurchasePrice = 20, SellPrice = 30, Quantity = 3 }
        );
        await db.SaveChangesAsync();
        Console.WriteLine("✅ Тестовые данные добавлены!");
    }
}

await InitializeDatabaseAsync(app.Services);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

// Явно указываем порт 8081
app.Run("http://0.0.0.0:8081");