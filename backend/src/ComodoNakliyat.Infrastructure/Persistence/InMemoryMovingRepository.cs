using System.Collections.Concurrent;
using ComodoNakliyat.Application.Contracts;
using ComodoNakliyat.Domain.Entities;
using ComodoNakliyat.Domain.Rules;

namespace ComodoNakliyat.Infrastructure.Persistence;

public sealed class InMemoryMovingRepository : IMovingRepository
{
    private readonly ConcurrentDictionary<string, MovingBooking> _bookings = new(StringComparer.OrdinalIgnoreCase);

    private static readonly IReadOnlyList<CityInfo> Cities = new List<CityInfo>
    {
        new() { Id = "istanbul", Name = "İstanbul", Region = "Marmara", HubDistanceIndex = 0, PopularDistricts = new() { "Kadıköy", "Beşiktaş", "Ataşehir", "Üsküdar", "Bakırköy", "Şişli", "Sarıyer", "Başakşehir", "Maltepe", "Pendik" } },
        new() { Id = "ankara", Name = "Ankara", Region = "İç Anadolu", HubDistanceIndex = 450, PopularDistricts = new() { "Çankaya", "Yenimahalle", "Keçiören", "Etimesgut", "Gölbaşı", "Mamak" } },
        new() { Id = "izmir", Name = "İzmir", Region = "Ege", HubDistanceIndex = 480, PopularDistricts = new() { "Karşıyaka", "Bornova", "Konak", "Çeşme", "Urla", "Buca", "Güzelbahçe" } },
        new() { Id = "antalya", Name = "Antalya", Region = "Akdeniz", HubDistanceIndex = 700, PopularDistricts = new() { "Konyaaltı", "Muratpaşa", "Lara", "Alanya", "Kemer", "Kaş", "Kepez" } },
        new() { Id = "bursa", Name = "Bursa", Region = "Marmara", HubDistanceIndex = 155, PopularDistricts = new() { "Nilüfer", "Osmangazi", "Mudanya", "İnegöl", "Yıldırım" } },
        new() { Id = "mugla", Name = "Muğla", Region = "Ege", HubDistanceIndex = 710, PopularDistricts = new() { "Bodrum", "Fethiye", "Marmaris", "Menteşe", "Datça" } },
        new() { Id = "kocaeli", Name = "Kocaeli", Region = "Marmara", HubDistanceIndex = 105, PopularDistricts = new() { "İzmit", "Gebze", "Kartepe", "Başiskele", "Darıca" } },
        new() { Id = "eskisehir", Name = "Eskişehir", Region = "İç Anadolu", HubDistanceIndex = 310, PopularDistricts = new() { "Tepebaşı", "Odunpazarı" } },
        new() { Id = "adana", Name = "Adana", Region = "Akdeniz", HubDistanceIndex = 940, PopularDistricts = new() { "Çukurova", "Seyhan", "Yüreğir" } },
        new() { Id = "mersin", Name = "Mersin", Region = "Akdeniz", HubDistanceIndex = 880, PopularDistricts = new() { "Yenişehir", "Mezitli", "Tarsus" } },
        new() { Id = "konya", Name = "Konya", Region = "İç Anadolu", HubDistanceIndex = 660, PopularDistricts = new() { "Selçuklu", "Meram", "Karatay" } },
        new() { Id = "trabzon", Name = "Trabzon", Region = "Karadeniz", HubDistanceIndex = 1060, PopularDistricts = new() { "Ortahisar", "Akçaabat", "Yomra" } }
    };

    public InMemoryMovingRepository()
    {
        var demo = new MovingBooking
        {
            TrackingCode = "CMD-2026-4820",
            CustomerName = "Ahmet Yılmaz",
            Phone = "0532 440 12 90",
            Email = "ahmet.yilmaz@ornek.com",
            FromCity = "İstanbul",
            FromDistrict = "Kadıköy",
            FromFloor = 4,
            FromElevator = ElevatorType.MobileLift,
            ToCity = "Ankara",
            ToDistrict = "Çankaya",
            ToFloor = 3,
            ToElevator = ElevatorType.BuildingElevator,
            RoomType = RoomType.ThreePlusOne,
            PackageTier = PackageTier.Standard,
            MoveDate = DateTime.UtcNow.AddDays(3).ToString("yyyy-MM-dd"),
            EstimatedPrice = 35500m,
            InsuranceCoverage = 400_000m,
            AssignedVehicle = "8.5m Hava Süspansiyonlu Büyük Kamyon",
            CrewSize = 5,
            Status = BookingStatus.InTransit,
            Notes = "Salondaki antika büfe ve 75 inç TV için özel ahşap sandıklama yapıldı."
        };
        _bookings[demo.TrackingCode] = demo;
    }

    public Task<IReadOnlyList<CityInfo>> GetCitiesAsync(CancellationToken ct = default)
        => Task.FromResult(Cities);

    public Task<int> GetDistanceKmAsync(string fromCity, string toCity, CancellationToken ct = default)
    {
        if (string.Equals(fromCity, toCity, StringComparison.OrdinalIgnoreCase))
            return Task.FromResult(25);

        var c1 = Cities.FirstOrDefault(c => c.Name.Equals(fromCity, StringComparison.OrdinalIgnoreCase) || c.Id.Equals(fromCity, StringComparison.OrdinalIgnoreCase));
        var c2 = Cities.FirstOrDefault(c => c.Name.Equals(toCity, StringComparison.OrdinalIgnoreCase) || c.Id.Equals(toCity, StringComparison.OrdinalIgnoreCase));
        if (c1 is null || c2 is null) return Task.FromResult(450);

        int diff = Math.Abs(c1.HubDistanceIndex - c2.HubDistanceIndex);
        return Task.FromResult(Math.Max(140, diff == 0 ? 350 : diff + 95));
    }

    public async Task<PriceBreakdownResult> CalculateQuoteAsync(CalculateQuoteRequest request, CancellationToken ct = default)
    {
        int distKm = await GetDistanceKmAsync(request.FromCity, request.ToCity, ct);
        return PricingCalculator.Calculate(
            roomType: request.RoomType,
            fromCity: request.FromCity,
            toCity: request.ToCity,
            fromFloor: request.FromFloor,
            fromElevator: request.FromElevator,
            toFloor: request.ToFloor,
            toElevator: request.ToElevator,
            packageTier: request.PackageTier,
            kitchenPacking: request.KitchenPacking,
            pianoOrSafe: request.PianoOrSafe,
            storage30Days: request.Storage30Days,
            estimatedDistanceKm: distKm
        );
    }

    public async Task<MovingBooking> CreateBookingAsync(CreateBookingRequest request, CancellationToken ct = default)
    {
        var breakdown = await CalculateQuoteAsync(request.Quote, ct);
        var code = $"CMD-2026-{Random.Shared.Next(1000, 9999)}";
        var booking = new MovingBooking
        {
            TrackingCode = code,
            CustomerName = request.CustomerName,
            Phone = request.Phone,
            Email = request.Email,
            MoveDate = request.MoveDate,
            Notes = request.Notes,
            FromCity = request.Quote.FromCity,
            FromDistrict = request.Quote.FromDistrict,
            FromFloor = request.Quote.FromFloor,
            FromElevator = request.Quote.FromElevator,
            ToCity = request.Quote.ToCity,
            ToDistrict = request.Quote.ToDistrict,
            ToFloor = request.Quote.ToFloor,
            ToElevator = request.Quote.ToElevator,
            RoomType = request.Quote.RoomType,
            PackageTier = request.Quote.PackageTier,
            Extras = new MoveExtras
            {
                DisassemblyAssembly = true,
                KitchenFragilePacking = request.Quote.KitchenPacking,
                PianoOrSafeBox = request.Quote.PianoOrSafe,
                StorageDays30 = request.Quote.Storage30Days
            },
            EstimatedPrice = breakdown.TotalPrice,
            InsuranceCoverage = breakdown.InsuranceCoverageLimit,
            AssignedVehicle = breakdown.RecommendedVehicle,
            CrewSize = breakdown.CrewSize,
            Status = BookingStatus.ExpertAssigned
        };

        _bookings[code] = booking;
        return booking;
    }

    public Task<MovingBooking?> GetBookingByCodeAsync(string trackingCode, CancellationToken ct = default)
    {
        _bookings.TryGetValue(trackingCode.Trim(), out var booking);
        return Task.FromResult(booking);
    }

    public Task<IReadOnlyList<MovingBooking>> GetAllBookingsAsync(CancellationToken ct = default)
        => Task.FromResult<IReadOnlyList<MovingBooking>>(_bookings.Values.OrderByDescending(x => x.CreatedAtUtc).ToList());
}
