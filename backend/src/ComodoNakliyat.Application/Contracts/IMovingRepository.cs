using ComodoNakliyat.Domain.Entities;
using ComodoNakliyat.Domain.Rules;

namespace ComodoNakliyat.Application.Contracts;

public sealed record CalculateQuoteRequest(
    RoomType RoomType,
    string FromCity,
    string FromDistrict,
    int FromFloor,
    ElevatorType FromElevator,
    string ToCity,
    string ToDistrict,
    int ToFloor,
    ElevatorType ToElevator,
    PackageTier PackageTier,
    bool KitchenPacking,
    bool PianoOrSafe,
    bool Storage30Days
);

public sealed record CreateBookingRequest(
    string CustomerName,
    string Phone,
    string Email,
    string MoveDate,
    string Notes,
    CalculateQuoteRequest Quote
);

public interface IMovingRepository
{
    Task<IReadOnlyList<CityInfo>> GetCitiesAsync(CancellationToken ct = default);
    Task<int> GetDistanceKmAsync(string fromCity, string toCity, CancellationToken ct = default);
    Task<PriceBreakdownResult> CalculateQuoteAsync(CalculateQuoteRequest request, CancellationToken ct = default);
    Task<MovingBooking> CreateBookingAsync(CreateBookingRequest request, CancellationToken ct = default);
    Task<MovingBooking?> GetBookingByCodeAsync(string trackingCode, CancellationToken ct = default);
    Task<IReadOnlyList<MovingBooking>> GetAllBookingsAsync(CancellationToken ct = default);
}
