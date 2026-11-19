using ComodoNakliyat.Domain.Entities;

namespace ComodoNakliyat.Domain.Rules;

public sealed record PriceBreakdownResult(
    decimal BaseRoomPrice,
    decimal DistanceCost,
    decimal FloorAndElevatorCost,
    decimal PackageCost,
    decimal ExtrasCost,
    decimal TotalPrice,
    decimal MinEstimate,
    decimal MaxEstimate,
    int EstimatedDistanceKm,
    int VolumeCubicMeters,
    int CrewSize,
    string RecommendedVehicle,
    string EstimatedDuration,
    decimal InsuranceCoverageLimit
);

public static class PricingCalculator
{
    private static readonly Dictionary<RoomType, (decimal BasePrice, int VolumeM3, int Crew, string Vehicle)> RoomSpecs = new()
    {
        [RoomType.OnePlusZero]  = (7500m,  14, 3, "4.5m Kapalı Çelik Kasa Panelvan"),
        [RoomType.OnePlusOne]   = (10500m, 22, 3, "5.5m Orta Boy Nakliyat Kamyoneti"),
        [RoomType.TwoPlusOne]   = (14500m, 34, 4, "7.2m Evden Eve Özel Kasa Kamyon"),
        [RoomType.ThreePlusOne] = (18500m, 48, 5, "8.5m Hava Süspansiyonlu Büyük Kamyon"),
        [RoomType.FourPlusOne]  = (23500m, 62, 6, "10m XL Evden Eve Nakliyat Kamyonu"),
        [RoomType.VillaDuplex]  = (31000m, 80, 7, "13.6m XXL Lüks Villa Nakliyat Tırı"),
        [RoomType.Office]       = (17500m, 40, 5, "7.5m Kurumsal Ofis & Arşiv Kamyonu")
    };

    public static PriceBreakdownResult Calculate(
        RoomType roomType,
        string fromCity,
        string toCity,
        int fromFloor,
        ElevatorType fromElevator,
        int toFloor,
        ElevatorType toElevator,
        PackageTier packageTier,
        bool kitchenPacking,
        bool pianoOrSafe,
        bool storage30Days,
        int estimatedDistanceKm)
    {
        var spec = RoomSpecs[roomType];
        var isIntercity = !string.Equals(fromCity.Trim(), toCity.Trim(), StringComparison.OrdinalIgnoreCase);

        // 1. Distance cost
        decimal distanceCost = 0m;
        int distanceKm = isIntercity ? Math.Max(120, estimatedDistanceKm) : 25;
        if (isIntercity)
        {
            decimal perKmRate = roomType >= RoomType.ThreePlusOne ? 24m : 19m;
            distanceCost = distanceKm * perKmRate;
        }

        // 2. Floor & Elevator cost
        decimal floorCost = CalculateSingleSideFloorCost(fromFloor, fromElevator)
                          + CalculateSingleSideFloorCost(toFloor, toElevator);

        // 3. Package Tier cost
        decimal packageCost = packageTier switch
        {
            PackageTier.Economic => 0m,
            PackageTier.Standard => 3200m,
            PackageTier.Vip      => 7500m,
            _                    => 0m
        };

        // 4. Extra services
        decimal extrasCost = 0m;
        if (kitchenPacking && packageTier != PackageTier.Vip) extrasCost += 2400m;
        if (pianoOrSafe) extrasCost += 3500m;
        if (storage30Days) extrasCost += 6500m;

        decimal total = spec.BasePrice + distanceCost + floorCost + packageCost + extrasCost;
        decimal minEst = Math.Round(total * 0.95m / 100m) * 100m;
        decimal maxEst = Math.Round(total * 1.08m / 100m) * 100m;

        string duration = isIntercity
            ? (distanceKm > 600 ? "24 - 36 Saat (Şehirler Arası Ekspres)" : "12 - 24 Saat (Şehirler Arası)")
            : (spec.VolumeM3 >= 48 ? "6 - 8 Saat (Aynı Gün Teslim)" : "4 - 6 Saat (Aynı Gün Teslim)");

        decimal insurance = packageTier switch
        {
            PackageTier.Vip      => 750_000m,
            PackageTier.Standard => 400_000m,
            _                    => 200_000m
        };

        return new PriceBreakdownResult(
            BaseRoomPrice: spec.BasePrice,
            DistanceCost: distanceCost,
            FloorAndElevatorCost: floorCost,
            PackageCost: packageCost,
            ExtrasCost: extrasCost,
            TotalPrice: total,
            MinEstimate: minEst,
            MaxEstimate: maxEst,
            EstimatedDistanceKm: distanceKm,
            VolumeCubicMeters: spec.VolumeM3,
            CrewSize: spec.Crew,
            RecommendedVehicle: spec.Vehicle,
            EstimatedDuration: duration,
            InsuranceCoverageLimit: insurance
        );
    }

    private static decimal CalculateSingleSideFloorCost(int floor, ElevatorType elevator)
    {
        if (floor <= 1 && elevator != ElevatorType.MobileLift) return 0m;

        return elevator switch
        {
            ElevatorType.BuildingElevator => Math.Max(0, floor - 1) * 200m,
            ElevatorType.StairsOnly       => Math.Max(0, floor) * 650m,
            ElevatorType.MobileLift       => 3000m + (floor > 8 ? (floor - 8) * 350m : 0m),
            _                             => 0m
        };
    }
}
