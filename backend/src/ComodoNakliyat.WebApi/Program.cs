using ComodoNakliyat.Application.Contracts;
using ComodoNakliyat.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<IMovingRepository, InMemoryMovingRepository>();
builder.Services.AddProblemDetails();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.UseExceptionHandler();
app.UseCors();

var api = app.MapGroup("/api");

api.MapGet("/cities", async (IMovingRepository repo, CancellationToken ct) =>
    Results.Ok(await repo.GetCitiesAsync(ct)));

api.MapPost("/quotes/calculate", async (CalculateQuoteRequest req, IMovingRepository repo, CancellationToken ct) =>
    Results.Ok(await repo.CalculateQuoteAsync(req, ct)));

api.MapPost("/bookings", async (CreateBookingRequest req, IMovingRepository repo, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(req.CustomerName) || string.IsNullOrWhiteSpace(req.Phone))
        return Results.BadRequest(new { title = "Ad Soyad ve Telefon zorunludur." });

    var created = await repo.CreateBookingAsync(req, ct);
    return Results.Created($"/api/bookings/{created.TrackingCode}", created);
});

api.MapGet("/bookings/{code}", async (string code, IMovingRepository repo, CancellationToken ct) =>
{
    var found = await repo.GetBookingByCodeAsync(code, ct);
    return found is not null ? Results.Ok(found) : Results.NotFound(new { title = "Taşınma kaydı bulunamadı." });
});

api.MapGet("/bookings", async (IMovingRepository repo, CancellationToken ct) =>
    Results.Ok(await repo.GetAllBookingsAsync(ct)));

app.Run();
