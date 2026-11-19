namespace ComodoNakliyat.Domain.Entities;

public enum RoomType
{
    OnePlusZero,   // 1+0 Stüdyo
    OnePlusOne,    // 1+1 Daire
    TwoPlusOne,    // 2+1 Daire
    ThreePlusOne,  // 3+1 Daire
    FourPlusOne,   // 4+1 Geniş Daire
    VillaDuplex,   // 5+1 / Villa / Dubleks
    Office         // Kurumsal Ofis / İş Yeri
}

public enum ElevatorType
{
    BuildingElevator, // Bina asansörü var ve eşya taşımaya uygun
    StairsOnly,       // Asansör yok (Bina merdiveni)
    MobileLift        // Dış cephe mobil nakliyat asansörü kurulsun
}

public enum PackageTier
{
    Economic, // Ekonomik (Demontaj-Montaj + Araç + İstifleme)
    Standard, // Standart Anahtar Teslim (Mobilya + Beyaz Eşya Kraft/Balonlu Ambalaj + Sigorta)
    Vip       // VIP Gold (Mutfak Kırılacaklar + Gardırop Askılı Tekstil + Tam Kurulum)
}

public enum BookingStatus
{
    Received,          // Talep Alındı
    ExpertAssigned,    // Eksper & Ekip Planlandı
    VehicleDispatched, // Araç & Asansör Yola Çıktı
    LoadingCompleted,  // Eşyalar Sigortalı Yüklendi
    InTransit,         // Transfer / Yolda
    Delivered          // Yeni Adrese Teslim & Kurulum Tamamlandı
}

public sealed class CityInfo
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public int HubDistanceIndex { get; set; }
    public List<string> PopularDistricts { get; set; } = new();
}

public sealed class MovingBooking
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string TrackingCode { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FromCity { get; set; } = string.Empty;
    public string FromDistrict { get; set; } = string.Empty;
    public int FromFloor { get; set; }
    public ElevatorType FromElevator { get; set; }
    public string ToCity { get; set; } = string.Empty;
    public string ToDistrict { get; set; } = string.Empty;
    public int ToFloor { get; set; }
    public ElevatorType ToElevator { get; set; }
    public RoomType RoomType { get; set; }
    public PackageTier PackageTier { get; set; }
    public MoveExtras Extras { get; set; } = new();
    public string MoveDate { get; set; } = string.Empty;
    public decimal EstimatedPrice { get; set; }
    public decimal InsuranceCoverage { get; set; }
    public string AssignedVehicle { get; set; } = string.Empty;
    public int CrewSize { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Received;
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

public sealed class MoveExtras
{
    public bool DisassemblyAssembly { get; set; } = true;
    public bool KitchenFragilePacking { get; set; }
    public bool PianoOrSafeBox { get; set; }
    public bool StorageDays30 { get; set; }
}
