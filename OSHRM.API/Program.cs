using Microsoft.EntityFrameworkCore;
using OSHRM.API.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Cấu hình DbContext Identity & Security (Kết nối SQL Server Database: OSHRM)
builder.Services.AddDbContext<AuthDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("AuthConnection")));

// 2. Cấu hình DbContext Core Business HRM (Kết nối SQL Server Database: OSHRM_DB)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("BusinessConnection")));

// 3. Cấu hình CORS cho phép các client truy cập API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 4. Đăng ký Controllers & Swagger Service
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 5. Cấu hình Middleware Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

// Cho phép tự động tìm và phục vụ index.html làm trang mặc định tại đường dẫn gốc /
app.UseDefaultFiles();

// Ep Kestrel luôn trả về Content-Type UTF-8 cho tất cả file HTML tĩnh
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        if (ctx.File.Name.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
        {
            ctx.Context.Response.ContentType = "text/html; charset=utf-8";
        }
    }
});

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();