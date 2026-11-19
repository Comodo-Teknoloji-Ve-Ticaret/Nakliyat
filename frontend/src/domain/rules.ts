// Saf iş kuralları — .NET PricingCalculator.cs ile birebir aynı fiyatlandırma algoritması.
import type {
  BookingStatus,
  CalculateQuoteRequest,
  ElevatorType,
  PackageTier,
  PriceBreakdownResult,
  RoomType,
} from './models'

export const ROOM_TYPE_META: Record<
  RoomType,
  {
    label: string
    shortLabel: string
    subtitle: string
    basePrice: number
    volumeM3: number
    crew: number
    vehicle: string
    maxItemsHint: string
  }
> = {
  OnePlusZero: {
    label: '1+0 Stüdyo Daire',
    shortLabel: '1+0 Stüdyo',
    subtitle: 'Bekar / Öğrenci Evi · Az Eşya',
    basePrice: 7500,
    volumeM3: 14,
    crew: 3,
    vehicle: '4.5m Kapalı Çelik Kasa Panelvan',
    maxItemsHint: '1 Yatak, Mini Koltuk, Beyaz Eşya, ~15 Koli',
  },
  OnePlusOne: {
    label: '1+1 Daire',
    shortLabel: '1+1 Daire',
    subtitle: 'Çift / Küçük Aile Evi',
    basePrice: 10500,
    volumeM3: 22,
    crew: 3,
    vehicle: '5.5m Orta Boy Nakliyat Kamyoneti',
    maxItemsHint: '1 Yatak Odası, Salon Takımı, Beyaz Eşya, ~25 Koli',
  },
  TwoPlusOne: {
    label: '2+1 Daire',
    shortLabel: '2+1 Daire',
    subtitle: 'En Çok Tercih Edilen Standart Aile Evi',
    basePrice: 14500,
    volumeM3: 34,
    crew: 4,
    vehicle: '7.2m Evden Eve Özel Kasa Kamyon',
    maxItemsHint: '2 Yatak Odası, Salon, Mutfak, ~40 Koli',
  },
  ThreePlusOne: {
    label: '3+1 Daire',
    shortLabel: '3+1 Daire',
    subtitle: 'Geniş Aile Dairesi · Tam Donanım',
    basePrice: 18500,
    volumeM3: 48,
    crew: 5,
    vehicle: '8.5m Hava Süspansiyonlu Büyük Kamyon',
    maxItemsHint: '3 Yatak Odası, Yemek Odası, Salon, ~55 Koli',
  },
  FourPlusOne: {
    label: '4+1 Büyük Daire',
    shortLabel: '4+1 Daire',
    subtitle: 'Büyük Metrekare · Çoklu Gardırop',
    basePrice: 23500,
    volumeM3: 62,
    crew: 6,
    vehicle: '10m XL Evden Eve Nakliyat Kamyonu',
    maxItemsHint: '4 Oda + Salon, Çalışma Odası, ~75 Koli',
  },
  VillaDuplex: {
    label: '5+1 / Villa / Dubleks',
    shortLabel: 'Villa / Dubleks',
    subtitle: 'Müstakil Villa & Bahçe Mobilyaları',
    basePrice: 31000,
    volumeM3: 80,
    crew: 7,
    vehicle: '13.6m XXL Lüks Villa Nakliyat Tırı',
    maxItemsHint: 'Çok Katlı Villa, Bahçe Takımı, ~100+ Koli',
  },
  Office: {
    label: 'Kurumsal Ofis & İş Yeri',
    shortLabel: 'Ofis Taşıma',
    subtitle: 'Server, Arşiv Dolabı & Çalışma Masaları',
    basePrice: 17500,
    volumeM3: 40,
    crew: 5,
    vehicle: '7.5m Kurumsal Ofis & Arşiv Kamyonu',
    maxItemsHint: '10-25 Personel Masası, Toplantı Odası, IT Ekipmanı',
  },
}

export const ELEVATOR_META: Record<
  ElevatorType,
  { label: string; desc: string; badge: string }
> = {
  BuildingElevator: {
    label: 'Bina Asansörü Var',
    desc: 'Eşya taşımaya uygun bina içi yük/insan asansörü mevcut',
    badge: 'Standart',
  },
  StairsOnly: {
    label: 'Asansör Yok (Merdiven)',
    desc: 'Eşyalar bina merdiveninden personel ile taşınacak',
    badge: '+650 TL / Kat',
  },
  MobileLift: {
    label: 'Dış Cephe Asansörü Kurulsun',
    desc: 'Balkon/pencereden 18. kata kadar teleskopik dış asansör',
    badge: 'Önerilen · Sıfır Çizik',
  },
}

export const PACKAGE_TIER_META: Record<
  PackageTier,
  {
    name: string
    tagline: string
    priceAdd: number
    insuranceLimit: number
    badge?: string
    features: string[]
  }
> = {
  Economic: {
    name: 'Ekonomik Paket',
    tagline: 'Koli hazırlığı sizden, ağır mobilya ve beyaz eşya bizden',
    priceAdd: 0,
    insuranceLimit: 200000,
    features: [
      'Mobilya söküm ve yeni evde kurulum (Marangoz dahil)',
      'Beyaz eşya ve koltukların battaniye/streç sarımı',
      'Kapalı çelik kasa araç ve uzman taşıma ekibi',
      '200.000 TL Allianz Yurtiçi Nakliyat Sigortası',
    ],
  },
  Standard: {
    name: 'Standart Anahtar Teslim',
    tagline: 'Tüm mobilya, beyaz eşya ve yatakların çift katmanlı hijyenik ambalajı',
    priceAdd: 3200,
    insuranceLimit: 400000,
    badge: 'En Çok Tercih Edilen',
    features: [
      'Havalı balonlu naylon + kraft kağıt çift katmanlı ambalaj',
      'Yatak ve koltuklar için sıfır hijyenik koruma kılıfı',
      'Avize, perde, TV ünitesi ve beyaz eşya tesisat montajı',
      'Askılı tekstil kolileri ile kıyafetlerin ütüsü bozulmadan taşınması',
      '400.000 TL Kapsamlı Eşya Sigortası',
    ],
  },
  Vip: {
    name: 'VIP Gold (El Sürmeden Taşın)',
    tagline: 'Mutfak bardaklarından gardırop kıyafetlerinize kadar %100 biz topluyoruz',
    priceAdd: 7500,
    insuranceLimit: 750000,
    badge: 'Tam Konfor VIP',
    features: [
      'Mutfaktaki tüm kırılacak tabak/bardakların tek tek sarılıp kolilenmesi',
      'Tüm kıyafet, kitap ve kişisel eşyaların oda bazlı etiketli paketlenmesi',
      'Yeni evde tüm kolilerin açılıp dolap içlerine yerleştirilmesi',
      'Özel ahşap kasalama (TV, tablo, ayna ve hassas elektronikler)',
      '750.000 TL Tam Kapsamlı VIP Sigorta Poliçesi',
    ],
  },
}

export const BOOKING_STATUS_STEPS: {
  key: BookingStatus
  label: string
  desc: string
}[] = [
  { key: 'Received', label: 'Talep & Fiyat Onaylandı', desc: 'Akıllı sihirbaz üzerinden taşınma planı ve sigorta kaydı oluşturuldu.' },
  { key: 'ExpertAssigned', label: 'Eksper & Ekip Atandı', desc: 'Taşınma hacmine uygun araç, marangoz ve ekip lideri planlandı.' },
  { key: 'VehicleDispatched', label: 'Araç & Mobil Asansör Yolda', desc: 'Kapalı kasa nakliyat aracımız çıkış adresine doğru harekete geçti.' },
  { key: 'LoadingCompleted', label: 'Ambalajlama & Yükleme Tamamlandı', desc: 'Tüm eşyalar balonlu kraft ambalajla sarılarak araca istiflendi.' },
  { key: 'InTransit', label: 'Transfer Halinde (GPS Takip)', desc: 'Aracımız yeni adresinize doğru güvenli hız limitleriyle seyir halinde.' },
  { key: 'Delivered', label: 'Teslimat & Montaj Tamamlandı', desc: 'Yeni evinizde tüm mobilya ve beyaz eşya kurulumları eksiksiz teslim edildi.' },
]

function calculateSingleSideFloorCost(floor: number, elevator: ElevatorType): number {
  if (floor <= 1 && elevator !== 'MobileLift') return 0
  switch (elevator) {
    case 'BuildingElevator':
      return Math.max(0, floor - 1) * 200
    case 'StairsOnly':
      return Math.max(0, floor) * 650
    case 'MobileLift':
      return 3000 + (floor > 8 ? (floor - 8) * 350 : 0)
  }
}

export function calculateMovingPrice(
  req: CalculateQuoteRequest,
  estimatedDistanceKm: number,
): PriceBreakdownResult {
  const spec = ROOM_TYPE_META[req.roomType]
  const isIntercity =
    req.fromCity.trim().toLocaleLowerCase('tr') !==
    req.toCity.trim().toLocaleLowerCase('tr')

  const distanceKm = isIntercity ? Math.max(120, estimatedDistanceKm) : 25
  let distanceCost = 0
  if (isIntercity) {
    const heavyRooms: RoomType[] = ['ThreePlusOne', 'FourPlusOne', 'VillaDuplex']
    const perKmRate = heavyRooms.includes(req.roomType) ? 24 : 19
    distanceCost = distanceKm * perKmRate
  }

  const floorAndElevatorCost =
    calculateSingleSideFloorCost(req.fromFloor, req.fromElevator) +
    calculateSingleSideFloorCost(req.toFloor, req.toElevator)

  const packageCost = PACKAGE_TIER_META[req.packageTier].priceAdd

  let extrasCost = 0
  if (req.kitchenPacking && req.packageTier !== 'Vip') extrasCost += 2400
  if (req.pianoOrSafe) extrasCost += 3500
  if (req.storage30Days) extrasCost += 6500

  const totalPrice =
    spec.basePrice +
    distanceCost +
    floorAndElevatorCost +
    packageCost +
    extrasCost

  const minEstimate = Math.round((totalPrice * 0.95) / 100) * 100
  const maxEstimate = Math.round((totalPrice * 1.08) / 100) * 100

  const estimatedDuration = isIntercity
    ? distanceKm > 600
      ? '24 - 36 Saat (Şehirler Arası Ekspres)'
      : '12 - 24 Saat (Şehirler Arası)'
    : spec.volumeM3 >= 48
      ? '6 - 8 Saat (Aynı Gün Anahtar Teslim)'
      : '4 - 6 Saat (Aynı Gün Anahtar Teslim)'

  return {
    baseRoomPrice: spec.basePrice,
    distanceCost,
    floorAndElevatorCost,
    packageCost,
    extrasCost,
    totalPrice,
    minEstimate,
    maxEstimate,
    estimatedDistanceKm: distanceKm,
    volumeCubicMeters: spec.volumeM3,
    crewSize: spec.crew,
    recommendedVehicle: spec.vehicle,
    estimatedDuration,
    insuranceCoverageLimit: PACKAGE_TIER_META[req.packageTier].insuranceLimit,
  }
}

export function formatTRY(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(amount)
}
