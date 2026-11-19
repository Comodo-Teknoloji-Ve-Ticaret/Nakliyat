import {
  ArrowRight,
  Building2,
  Calculator,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Compass,
  FileCheck2,
  Layers,
  MapPin,
  MessageCircle,
  PackageCheck,
  PhoneCall,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type {
  CalculateQuoteRequest,
  CityInfo,
  ElevatorType,
  MovingBooking,
  PackageTier,
  RoomType,
} from './domain/models'
import {
  BOOKING_STATUS_STEPS,
  ELEVATOR_META,
  PACKAGE_TIER_META,
  ROOM_TYPE_META,
  calculateMovingPrice,
  formatTRY,
} from './domain/rules'
import { services } from './infrastructure/container'
import { SEED_CITIES } from './infrastructure/mock/seed'

const ROOM_KEYS = Object.keys(ROOM_TYPE_META) as RoomType[]
const ELEVATOR_KEYS = Object.keys(ELEVATOR_META) as ElevatorType[]
const PACKAGE_KEYS = Object.keys(PACKAGE_TIER_META) as PackageTier[]
const FLOORS = Array.from({ length: 21 }, (_, i) => i) // 0 (Zemin/Bahçe) .. 20. Kat

export function App() {
  const [cities, setCities] = useState<CityInfo[]>(SEED_CITIES)

  // Wizard State
  const [quoteReq, setQuoteReq] = useState<CalculateQuoteRequest>({
    roomType: 'TwoPlusOne',
    fromCity: 'İstanbul',
    fromDistrict: 'Kadıköy',
    fromFloor: 3,
    fromElevator: 'BuildingElevator',
    toCity: 'Ankara',
    toDistrict: 'Çankaya',
    toFloor: 4,
    toElevator: 'MobileLift',
    packageTier: 'Standard',
    kitchenPacking: true,
    pianoOrSafe: false,
    storage30Days: false,
  })

  // Booking Modal State
  const [bookingOpen, setBookingOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [moveDate, setMoveDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 5)
    return d.toISOString().slice(0, 10)
  })
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [createdBooking, setCreatedBooking] = useState<MovingBooking | null>(null)

  // Live Tracking State
  const [trackCode, setTrackCode] = useState('CMD-2026-4820')
  const [trackedBooking, setTrackedBooking] = useState<MovingBooking | null>(null)
  const [trackNotFound, setTrackNotFound] = useState(false)

  useEffect(() => {
    services.moving.getCities().then(setCities).catch(() => {})
    services.moving.getBookingByCode('CMD-2026-4820').then((b) => {
      if (b) setTrackedBooking(b)
    })
  }, [])

  const fromCityObj = useMemo(
    () => cities.find((c) => c.name === quoteReq.fromCity) ?? cities[0],
    [cities, quoteReq.fromCity],
  )
  const toCityObj = useMemo(
    () => cities.find((c) => c.name === quoteReq.toCity) ?? cities[1],
    [cities, quoteReq.toCity],
  )

  const distanceKm = useMemo(() => {
    if (quoteReq.fromCity === quoteReq.toCity) return 25
    const diff = Math.abs(
      (fromCityObj?.hubDistanceIndex ?? 0) - (toCityObj?.hubDistanceIndex ?? 450),
    )
    return Math.max(140, diff === 0 ? 350 : diff + 95)
  }, [quoteReq.fromCity, quoteReq.toCity, fromCityObj, toCityObj])

  const breakdown = useMemo(
    () => calculateMovingPrice(quoteReq, distanceKm),
    [quoteReq, distanceKm],
  )

  const isIntercity = quoteReq.fromCity !== quoteReq.toCity

  const handleFromCityChange = (cityName: string) => {
    const found = cities.find((c) => c.name === cityName)
    setQuoteReq((prev) => ({
      ...prev,
      fromCity: cityName,
      fromDistrict: found?.popularDistricts[0] ?? 'Merkez',
    }))
  }

  const handleToCityChange = (cityName: string) => {
    const found = cities.find((c) => c.name === cityName)
    setQuoteReq((prev) => ({
      ...prev,
      toCity: cityName,
      toDistrict: found?.popularDistricts[0] ?? 'Merkez',
    }))
  }

  const applyQuickScenario = (
    roomType: RoomType,
    fromCity: string,
    toCity: string,
    fromFloor: number,
    toFloor: number,
    toElevator: ElevatorType,
  ) => {
    const fc = cities.find((c) => c.name === fromCity)
    const tc = cities.find((c) => c.name === toCity)
    setQuoteReq((prev) => ({
      ...prev,
      roomType,
      fromCity,
      fromDistrict: fc?.popularDistricts[0] ?? 'Merkez',
      toCity,
      toDistrict: tc?.popularDistricts[0] ?? 'Merkez',
      fromFloor,
      toFloor,
      toElevator,
    }))
    document.getElementById('fiyat-sihirbazi')?.scrollIntoView({ behavior: 'smooth' })
  }

  async function handleCreateBooking(e: FormEvent) {
    e.preventDefault()
    if (customerName.trim().length < 3) {
      setFormError('Lütfen adınızı ve soyadınızı girin.')
      return
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setFormError('Lütfen geçerli bir telefon numarası girin.')
      return
    }
    setFormError('')
    const booking = await services.moving.createBooking({
      customerName,
      phone,
      email: email || 'musteri@comodonakliyat.com',
      moveDate,
      notes,
      quote: quoteReq,
    })
    setCreatedBooking(booking)
    setTrackedBooking(booking)
    setTrackCode(booking.trackingCode)
  }

  async function handleTrackSubmit(e: FormEvent) {
    e.preventDefault()
    const found = await services.moving.getBookingByCode(trackCode)
    if (found) {
      setTrackedBooking(found)
      setTrackNotFound(false)
    } else {
      setTrackedBooking(null)
      setTrackNotFound(true)
    }
  }

  const whatsappText = encodeURIComponent(
    `Merhaba Comodo Nakliyat! Fiyat Hesaplama Sihirbazından teklif aldım:\n` +
      `• Oda Tipi: ${ROOM_TYPE_META[quoteReq.roomType].label} (${breakdown.volumeCubicMeters} m³)\n` +
      `• Çıkış: ${quoteReq.fromCity} / ${quoteReq.fromDistrict} (${quoteReq.fromFloor}. Kat - ${ELEVATOR_META[quoteReq.fromElevator].label})\n` +
      `• Varış: ${quoteReq.toCity} / ${quoteReq.toDistrict} (${quoteReq.toFloor}. Kat - ${ELEVATOR_META[quoteReq.toElevator].label})\n` +
      `• Paket: ${PACKAGE_TIER_META[quoteReq.packageTier].name}\n` +
      `• Hesaplanan Tutar: ${formatTRY(breakdown.totalPrice)}\n` +
      `Ekspertiz ve rezervasyon için bilgi alabilir miyim?`,
  )

  return (
    <>
      {/* ── TOPBAR ── */}
      <div className="topbar">
        <div className="container topbar__inner">
          <div className="topbar__left">
            <span className="topbar__badge">
              <ShieldCheck size={15} /> Allianz 750.000 TL'ye Kadar Sigortalı Taşımacılık
            </span>
            <span>· 81 İlde Şehir İçi & Şehirler Arası K3 Yetki Belgeli Filo</span>
          </div>
          <div className="topbar__right">
            <a href="#tasinma-takip">📦 Taşınma Takip: CMD-2026-4820</a>
            <a href="tel:+905078505287" style={{ color: '#FDBA74', fontWeight: 700 }}>
              <PhoneCall size={14} style={{ verticalAlign: '-2px' }} /> 0507 850 5287
            </a>
          </div>
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <header className="navbar">
        <div className="container navbar__inner">
          <a href="#" className="brand">
            <div className="brand__icon">
              <Truck size={24} />
            </div>
            <div>
              <div className="brand__title">
                Comodo<span>Nakliyat</span>
              </div>
              <div className="brand__sub">Akıllı Evden Eve Lojistik</div>
            </div>
          </a>

          <nav className="navlinks">
            <a href="#fiyat-sihirbazi">Fiyat Hesaplama Sihirbazı</a>
            <a href="#tasinma-takip">Canlı Taşınma Takip</a>
            <a href="#arac-filomuz">Araç & Asansör Filosu</a>
            <a href="#paketler">Ambalaj Paketleri</a>
            <a href="#yorumlar">Müşteri Yorumları</a>
          </nav>

          <div className="navbar__actions">
            <a href="tel:+905078505287" className="btn btn--outline">
              <PhoneCall size={16} /> 0507 850 5287
            </a>
            <a href="#fiyat-sihirbazi" className="btn btn--primary">
              <Calculator size={16} /> Fiyat Hesapla
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <div className="pill-tag">
              <Sparkles size={15} /> Türkiye'nin İlk Şeffaf Nakliyat Fiyat Sihirbazı
            </div>
            <h1>
              Oda sayısı, kat ve şehir seç;{' '}
              <span className="hl">nakliyat fiyatını 10 saniyede</span> öğren.
            </h1>
            <p className="hero__lead">
              Telefonda sürpriz rakamlara ve taşınma günü çıkan ek ücretlere son!{' '}
              <strong>1+1, 2+1, 3+1, 4+1 veya Villa</strong> seçiminize, kat/asansör durumunuza ve
              81 il mesafesine göre net sabit fiyat garantisiyle sigortalı taşının.
            </p>
            <div className="hero__cta">
              <a href="#fiyat-sihirbazi" className="btn btn--primary btn--lg">
                <Calculator size={19} /> Hemen Fiyat Hesapla <ArrowRight size={18} />
              </a>
              <a href="#tasinma-takip" className="btn btn--outline btn--lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>
                <Compass size={19} /> Taşınma Kodu Sorgula
              </a>
            </div>

            <div className="hero__stats">
              <div className="stat-box">
                <b>14.800+</b>
                <span>Sorunsuz Ev Taşıma</span>
              </div>
              <div className="stat-box">
                <b>81 İl</b>
                <span>Türkiye Geneli Sefer</span>
              </div>
              <div className="stat-box">
                <b>18. Kat</b>
                <span>Mobil Dış Asansör</span>
              </div>
              <div className="stat-box">
                <b>4.9 ★</b>
                <span>Müşteri Memnuniyeti</span>
              </div>
            </div>
          </div>

          {/* Right Quick Scenarios Card */}
          <div className="hero__card">
            <div className="hero__card-head">
              <div>
                <span style={{ fontSize: 12, color: '#FDBA74', fontWeight: 700, textTransform: 'uppercase' }}>
                  Tek Tıkla Örnek Senaryolar
                </span>
                <h3 style={{ fontSize: 20, color: '#fff', marginTop: 2 }}>
                  Popüler Taşınma Rotaları
                </h3>
              </div>
              <span style={{ background: 'rgba(16,185,129,0.2)', color: '#34D399', padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
                Canlı Hesaplama
              </span>
            </div>

            <div className="hero__quick-list">
              <button
                type="button"
                className="hero__quick-item"
                onClick={() => applyQuickScenario('TwoPlusOne', 'İstanbul', 'İstanbul', 2, 3, 'BuildingElevator')}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 14.5 }}>
                    🏠 2+1 Şehir İçi (İstanbul → İstanbul)
                  </div>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>
                    2. Kat → 3. Kat · Bina Asansörlü · 34 m³
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#FDBA74', fontSize: 16 }}>18.300 ₺</div>
                  <div style={{ fontSize: 11, color: '#34D399' }}>Sihirbazda Aç →</div>
                </div>
              </button>

              <button
                type="button"
                className="hero__quick-item"
                onClick={() => applyQuickScenario('ThreePlusOne', 'İstanbul', 'Ankara', 3, 4, 'MobileLift')}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 14.5 }}>
                    🚚 3+1 Şehirler Arası (İstanbul → Ankara)
                  </div>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>
                    3. Kat → 4. Kat · Dış Cephe Asansörlü · 48 m³
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#FDBA74', fontSize: 16 }}>38.180 ₺</div>
                  <div style={{ fontSize: 11, color: '#34D399' }}>Sihirbazda Aç →</div>
                </div>
              </button>

              <button
                type="button"
                className="hero__quick-item"
                onClick={() => applyQuickScenario('TwoPlusOne', 'İzmir', 'Antalya', 1, 2, 'BuildingElevator')}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 14.5 }}>
                    🌴 2+1 Ege - Akdeniz (İzmir → Antalya)
                  </div>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>
                    1. Kat → 2. Kat · Bina Asansörlü · 315 km
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#FDBA74', fontSize: 16 }}>23.885 ₺</div>
                  <div style={{ fontSize: 11, color: '#34D399' }}>Sihirbazda Aç →</div>
                </div>
              </button>

              <button
                type="button"
                className="hero__quick-item"
                onClick={() => applyQuickScenario('FourPlusOne', 'Ankara', 'Muğla', 5, 1, 'MobileLift')}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 14.5 }}>
                    🏡 4+1 Geniş Aile (Ankara → Bodrum/Muğla)
                  </div>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>
                    5. Kat → Villa · Mobil Asansör + 62 m³ Kamyon
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#FDBA74', fontSize: 16 }}>38.980 ₺</div>
                  <div style={{ fontSize: 11, color: '#34D399' }}>Sihirbazda Aç →</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE MOVING PRICE CALCULATOR WIZARD ── */}
      <section id="fiyat-sihirbazi" className="wizard-sec">
        <div className="container">
          <div className="sec-head">
            <span className="sec-eyebrow">
              <Calculator size={14} /> Akıllı Fiyat Hesaplama Motoru (.NET Clean Architecture)
            </span>
            <h2>Anında Nakliyat Fiyatı Hesaplama Sihirbazı</h2>
            <p>
              Evinizin oda sayısını, çıkış ve varış şehirlerini, bulunduğunuz katı ve asansör
              durumunu seçin; algoritmamız araç büyüklüğünü, personel sayısını ve net fiyatı anında
              hesaplasın.
            </p>
          </div>

          <div className="wizard-layout">
            {/* LEFT: 3-STEP INTERACTIVE CONTROLS */}
            <div className="wizard-panel">
              {/* STEP 1: ROOM SIZE */}
              <div className="w-step">
                <div className="w-step__head">
                  <div className="w-step__num">1</div>
                  <h3>Evinizin Oda Sayısını Seçin</h3>
                  <span>Hacim (m³) ve araç tipi otomatik belirlenir</span>
                </div>

                <div className="room-grid">
                  {ROOM_KEYS.map((rk) => {
                    const meta = ROOM_TYPE_META[rk]
                    const active = quoteReq.roomType === rk
                    return (
                      <button
                        key={rk}
                        type="button"
                        className={`room-card ${active ? 'is-active' : ''}`}
                        onClick={() => setQuoteReq({ ...quoteReq, roomType: rk })}
                      >
                        <div className="room-card__top">
                          <span className="room-card__title">{meta.shortLabel}</span>
                          <span className="room-card__vol">{meta.volumeM3} m³</span>
                        </div>
                        <span className="room-card__sub">{meta.subtitle}</span>
                        <div className="room-card__price">
                          Baz: {formatTRY(meta.basePrice)}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* STEP 2: CITIES, FLOORS & ELEVATORS */}
              <div className="w-step">
                <div className="w-step__head">
                  <div className="w-step__num">2</div>
                  <h3>Şehir, Kat ve Asansör Durumu</h3>
                  <span>
                    {isIntercity
                      ? `Şehirler Arası (~${breakdown.estimatedDistanceKm} km)`
                      : 'Şehir İçi Taşıma'}
                  </span>
                </div>

                <div className="route-grid">
                  {/* FROM BOX */}
                  <div className="route-box">
                    <div className="route-box__title">
                      <MapPin size={18} color="var(--brand)" />
                      <span>Eşyanın Alınacağı Adres (Çıkış)</span>
                    </div>

                    <div className="field-row">
                      <div className="field">
                        <label>Çıkış Şehri (İl)</label>
                        <select
                          className="select"
                          value={quoteReq.fromCity}
                          onChange={(e) => handleFromCityChange(e.target.value)}
                        >
                          {cities.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name} ({c.region})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="field">
                        <label>İlçe</label>
                        <select
                          className="select"
                          value={quoteReq.fromDistrict}
                          onChange={(e) =>
                            setQuoteReq({ ...quoteReq, fromDistrict: e.target.value })
                          }
                        >
                          {(fromCityObj?.popularDistricts ?? ['Merkez']).map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="field">
                      <label>Bulunduğu Kat: {quoteReq.fromFloor === 0 ? 'Zemin / Bahçe Katı' : `${quoteReq.fromFloor}. Kat`}</label>
                      <select
                        className="select"
                        value={quoteReq.fromFloor}
                        onChange={(e) =>
                          setQuoteReq({ ...quoteReq, fromFloor: Number(e.target.value) })
                        }
                      >
                        {FLOORS.map((fl) => (
                          <option key={fl} value={fl}>
                            {fl === 0 ? '0 - Zemin / Giriş / Müstakil' : `${fl}. Kat`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="floor-pills">
                      {ELEVATOR_KEYS.map((ek) => {
                        const em = ELEVATOR_META[ek]
                        const act = quoteReq.fromElevator === ek
                        return (
                          <button
                            key={ek}
                            type="button"
                            className={`elev-btn ${act ? 'is-active' : ''}`}
                            onClick={() => setQuoteReq({ ...quoteReq, fromElevator: ek })}
                          >
                            <span>{em.label}</span>
                            <span className="elev-btn__badge">{em.badge}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* TO BOX */}
                  <div className="route-box">
                    <div className="route-box__title">
                      <MapPin size={18} color="var(--emerald)" />
                      <span>Eşyanın Gideceği Adres (Varış)</span>
                    </div>

                    <div className="field-row">
                      <div className="field">
                        <label>Varış Şehri (İl)</label>
                        <select
                          className="select"
                          value={quoteReq.toCity}
                          onChange={(e) => handleToCityChange(e.target.value)}
                        >
                          {cities.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name} ({c.region})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="field">
                        <label>İlçe</label>
                        <select
                          className="select"
                          value={quoteReq.toDistrict}
                          onChange={(e) =>
                            setQuoteReq({ ...quoteReq, toDistrict: e.target.value })
                          }
                        >
                          {(toCityObj?.popularDistricts ?? ['Merkez']).map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="field">
                      <label>Çıkılacak Kat: {quoteReq.toFloor === 0 ? 'Zemin / Bahçe Katı' : `${quoteReq.toFloor}. Kat`}</label>
                      <select
                        className="select"
                        value={quoteReq.toFloor}
                        onChange={(e) =>
                          setQuoteReq({ ...quoteReq, toFloor: Number(e.target.value) })
                        }
                      >
                        {FLOORS.map((fl) => (
                          <option key={fl} value={fl}>
                            {fl === 0 ? '0 - Zemin / Giriş / Müstakil' : `${fl}. Kat`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="floor-pills">
                      {ELEVATOR_KEYS.map((ek) => {
                        const em = ELEVATOR_META[ek]
                        const act = quoteReq.toElevator === ek
                        return (
                          <button
                            key={ek}
                            type="button"
                            className={`elev-btn ${act ? 'is-active' : ''}`}
                            onClick={() => setQuoteReq({ ...quoteReq, toElevator: ek })}
                          >
                            <span>{em.label}</span>
                            <span className="elev-btn__badge">{em.badge}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 3: PACKAGING & EXTRAS */}
              <div className="w-step" id="paketler">
                <div className="w-step__head">
                  <div className="w-step__num">3</div>
                  <h3>Ambalaj Paketi & Ek Hizmetler</h3>
                  <span>Sigorta teminatı seçilen pakete göre artar</span>
                </div>

                <div className="pkg-grid">
                  {PACKAGE_KEYS.map((pk) => {
                    const pm = PACKAGE_TIER_META[pk]
                    const act = quoteReq.packageTier === pk
                    return (
                      <button
                        key={pk}
                        type="button"
                        className={`pkg-card ${act ? 'is-active' : ''}`}
                        onClick={() => setQuoteReq({ ...quoteReq, packageTier: pk })}
                      >
                        <div>
                          {pm.badge && <span className="pkg-card__badge">{pm.badge}</span>}
                          <h4>{pm.name}</h4>
                          <p>{pm.tagline}</p>
                          <ul className="pkg-card__list">
                            {pm.features.slice(0, 3).map((f) => (
                              <li key={f}>
                                <Check size={14} color="var(--brand)" style={{ flexShrink: 0, marginTop: 2 }} />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--navy)', paddingTop: 8, borderTop: '1px solid var(--line)' }}>
                          {pm.priceAdd === 0 ? 'Fiyata Dahil (0 ₺)' : `+ ${formatTRY(pm.priceAdd)}`}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Extra Services Checkboxes */}
                <div className="extras-grid">
                  <button
                    type="button"
                    className={`extra-pill ${quoteReq.kitchenPacking ? 'is-active' : ''}`}
                    onClick={() =>
                      setQuoteReq({ ...quoteReq, kitchenPacking: !quoteReq.kitchenPacking })
                    }
                  >
                    <CheckCircle2
                      size={20}
                      color={quoteReq.kitchenPacking ? 'var(--emerald)' : 'var(--muted)'}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>Mutfak & Kırılacak Kolileme</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                        {quoteReq.packageTier === 'Vip' ? 'VIP Pakete Dahil' : '+2.400 ₺ · Özel Fıçılı'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`extra-pill ${quoteReq.pianoOrSafe ? 'is-active' : ''}`}
                    onClick={() =>
                      setQuoteReq({ ...quoteReq, pianoOrSafe: !quoteReq.pianoOrSafe })
                    }
                  >
                    <CheckCircle2
                      size={20}
                      color={quoteReq.pianoOrSafe ? 'var(--emerald)' : 'var(--muted)'}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>Çelik Kasa / Piyano Taşıma</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>+3.500 ₺ · Özel Kızaklı</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`extra-pill ${quoteReq.storage30Days ? 'is-active' : ''}`}
                    onClick={() =>
                      setQuoteReq({ ...quoteReq, storage30Days: !quoteReq.storage30Days })
                    }
                  >
                    <CheckCircle2
                      size={20}
                      color={quoteReq.storage30Days ? 'var(--emerald)' : 'var(--muted)'}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>30 Gün Eşya Depolama</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>+6.500 ₺ · 7/24 Güvenlikli</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: STICKY LIVE QUOTE RECEIPT */}
            <aside className="quote-card">
              <div className="quote-card__header">
                <div>
                  <span style={{ fontSize: 11.5, color: '#FDBA74', fontWeight: 800, letterSpacing: '0.06em' }}>
                    CANLI FİYAT DÖKÜMÜ
                  </span>
                  <h3 style={{ fontSize: 20, color: '#fff' }}>
                    {quoteReq.fromCity} → {quoteReq.toCity}
                  </h3>
                </div>
                <span style={{ background: 'rgba(16,185,129,0.2)', color: '#34D399', padding: '5px 11px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
                  Sabit Fiyat Garantisi
                </span>
              </div>

              <div className="quote-price-box">
                <div className="quote-price-box__label">Hesaplanan Net Nakliyat Tutarı</div>
                <div className="quote-price-box__main">{formatTRY(breakdown.totalPrice)}</div>
                <div className="quote-price-box__range">
                  Piyasa Aralığı: {formatTRY(breakdown.minEstimate)} – {formatTRY(breakdown.maxEstimate)} (KDV & Sigorta Dahil)
                </div>
              </div>

              <div className="quote-specs">
                <div className="q-spec">
                  <span>Önerilen Araç Tipi</span>
                  <b>{breakdown.recommendedVehicle}</b>
                </div>
                <div className="q-spec">
                  <span>Eşya Hacmi & Ekip</span>
                  <b>
                    {breakdown.volumeCubicMeters} m³ · {breakdown.crewSize} Uzman Personel
                  </b>
                </div>
                <div className="q-spec">
                  <span>Tahmini Süre</span>
                  <b>{breakdown.estimatedDuration}</b>
                </div>
                <div className="q-spec">
                  <span>Allianz Sigorta Teminatı</span>
                  <b style={{ color: '#34D399' }}>{formatTRY(breakdown.insuranceCoverageLimit)}</b>
                </div>
              </div>

              <div className="quote-lines">
                <div className="quote-line">
                  <span>
                    {ROOM_TYPE_META[quoteReq.roomType].label} Baz Ücreti
                  </span>
                  <b>{formatTRY(breakdown.baseRoomPrice)}</b>
                </div>
                <div className="quote-line">
                  <span>
                    Mesafe Ücreti ({isIntercity ? `${breakdown.estimatedDistanceKm} km Şehirler Arası` : 'Şehir İçi'})
                  </span>
                  <b>
                    {breakdown.distanceCost === 0
                      ? 'Şehir İçi Dahil'
                      : `+ ${formatTRY(breakdown.distanceCost)}`}
                  </b>
                </div>
                <div className="quote-line">
                  <span>
                    Kat & Asansör ({quoteReq.fromFloor}. Kat → {quoteReq.toFloor}. Kat)
                  </span>
                  <b>
                    {breakdown.floorAndElevatorCost === 0
                      ? '0 ₺'
                      : `+ ${formatTRY(breakdown.floorAndElevatorCost)}`}
                  </b>
                </div>
                <div className="quote-line">
                  <span>{PACKAGE_TIER_META[quoteReq.packageTier].name}</span>
                  <b>
                    {breakdown.packageCost === 0
                      ? 'Standart Dahil'
                      : `+ ${formatTRY(breakdown.packageCost)}`}
                  </b>
                </div>
                {breakdown.extrasCost > 0 && (
                  <div className="quote-line">
                    <span>Seçilen Ek Hizmetler</span>
                    <b>+ {formatTRY(breakdown.extrasCost)}</b>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn--primary btn--lg btn--block"
                  onClick={() => {
                    setCreatedBooking(null)
                    setBookingOpen(true)
                  }}
                >
                  <Calendar size={18} /> Bu Fiyatı Sabitle & Rezervasyon Yap
                </button>

                <a
                  href={`https://wa.me/905078505287?text=${whatsappText}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn--emerald btn--block"
                >
                  <MessageCircle size={18} /> Teklifi WhatsApp'tan Gönder
                </a>
              </div>

              <p style={{ fontSize: 11.5, color: '#94A3B8', textAlign: 'center', marginTop: 12 }}>
                🔒 Ön ödeme yok! Ücretsiz video ekspertiz sonrası resmi sözleşme imzalanır.
              </p>
            </aside>
          </div>
        </div>
      </section>

      {/* ── LIVE MOVING TRACKER SECTION ── */}
      <section id="tasinma-takip" className="section-alt">
        <div className="container">
          <div className="sec-head">
            <span className="sec-eyebrow">
              <Compass size={14} /> Canlı Operasyon & GPS Takip
            </span>
            <h2>Taşınma Kodu ile Eşyalarım Nerede?</h2>
            <p>
              Rezervasyon sonrası size verilen takip koduyla (Örn: <strong>CMD-2026-4820</strong> veya{' '}
              <strong>CMD-2026-7195</strong>) aracınızın ve ekibinizin durumunu anlık izleyin.
            </p>
          </div>

          <div className="wizard-panel" style={{ maxWidth: 980, margin: '0 auto' }}>
            <form
              onSubmit={handleTrackSubmit}
              style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}
            >
              <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                <input
                  className="input"
                  style={{ height: 48, paddingLeft: 16, fontSize: 15 }}
                  value={trackCode}
                  onChange={(e) => setTrackCode(e.target.value)}
                  placeholder="Takip kodunuzu girin (Örn: CMD-2026-4820)"
                />
              </div>
              <button type="submit" className="btn btn--navy" style={{ height: 48 }}>
                <Search size={17} /> Durumu Sorgula
              </button>
              <button
                type="button"
                className="btn btn--outline"
                style={{ height: 48 }}
                onClick={() => {
                  setTrackCode('CMD-2026-4820')
                  services.moving.getBookingByCode('CMD-2026-4820').then(setTrackedBooking)
                }}
              >
                Örnek: CMD-2026-4820
              </button>
            </form>

            {trackNotFound && (
              <div style={{ padding: 18, borderRadius: 14, background: '#FEF2F2', color: '#991B1B', fontWeight: 600 }}>
                Bu takip koduna ait aktif taşınma kaydı bulunamadı. Lütfen kodu kontrol edin.
              </div>
            )}

            {trackedBooking && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    gap: 16,
                    padding: 18,
                    borderRadius: 16,
                    background: 'var(--bg)',
                    border: '1px solid var(--line)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)' }}>
                      TAKİP KODU: #{trackedBooking.trackingCode}
                    </span>
                    <h3 style={{ fontSize: 20, marginTop: 2 }}>
                      {trackedBooking.customerName} ·{' '}
                      {ROOM_TYPE_META[trackedBooking.roomType].label}
                    </h3>
                    <p style={{ fontSize: 13.5, color: 'var(--muted)' }}>
                      📍 {trackedBooking.fromCity} ({trackedBooking.fromDistrict},{' '}
                      {trackedBooking.fromFloor}. Kat) → {trackedBooking.toCity} (
                      {trackedBooking.toDistrict}, {trackedBooking.toFloor}. Kat)
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>
                      {formatTRY(trackedBooking.estimatedPrice)}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--emerald)', fontWeight: 700 }}>
                      🛡️ Sigorta Poliçesi: {formatTRY(trackedBooking.insuranceCoverage)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      🚛 {trackedBooking.assignedVehicle} ({trackedBooking.crewSize} Personel)
                    </div>
                  </div>
                </div>

                {/* 6-step timeline */}
                <div className="timeline">
                  {BOOKING_STATUS_STEPS.map((st, idx) => {
                    const currentIdx = BOOKING_STATUS_STEPS.findIndex(
                      (x) => x.key === trackedBooking.status,
                    )
                    const isDone = idx < currentIdx
                    const isCurrent = idx === currentIdx
                    return (
                      <div
                        key={st.key}
                        className={`tl-step ${isDone ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}`}
                      >
                        <div style={{ fontSize: 11.5, fontWeight: 800, color: isCurrent ? 'var(--brand-hover)' : isDone ? 'var(--emerald)' : 'var(--muted)', marginBottom: 4 }}>
                          ADIM {idx + 1} {isDone ? '✓' : isCurrent ? '● AKTİF' : ''}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>
                          {st.label}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.35 }}>
                          {st.desc}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── VEHICLE & MOBILE ELEVATOR FLEET ── */}
      <section id="arac-filomuz" className="wizard-sec">
        <div className="container">
          <div className="sec-head">
            <span className="sec-eyebrow">
              <Truck size={14} /> Özmal Çelik Kasa Filo & 18. Kat Mobil Asansör
            </span>
            <h2>Her Ev Büyüklüğüne Özel Araç ve Ekipman</h2>
            <p>
              Eşyalarınız taşeron kamyonlarda değil; içi halıflex kaplı, hava süspansiyonlu kendi
              özmal araçlarımızda taşınır.
            </p>
          </div>

          <div className="fleet-grid">
            <div className="fleet-card">
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--brand-light)', color: 'var(--brand)', display: 'grid', placeItems: 'center', marginBottom: 14 }}>
                <Truck size={24} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)' }}>
                1+0 VE 1+1 DAİRELER İÇİN
              </span>
              <h3 style={{ fontSize: 19, margin: '4px 0 8px' }}>
                14 - 22 m³ Pratik Şehir İçi Panelvan & Kamyonet
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 12 }}>
                Dar sokaklara rahatça giren, hızlı yükleme sağlayan 3 kişilik uzman ekip ve marangoz
                donanımlı araçlarımız.
              </p>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--navy)' }}>
                ✓ Aynı Gün 4 Saatte Teslim · ✓ İç Halı Kaplama
              </div>
            </div>

            <div className="fleet-card">
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--emerald-light)', color: 'var(--emerald)', display: 'grid', placeItems: 'center', marginBottom: 14 }}>
                <PackageCheck size={24} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--emerald)' }}>
                2+1 VE 3+1 AİLE EVLERİ İÇİN
              </span>
              <h3 style={{ fontSize: 19, margin: '4px 0 8px' }}>
                34 - 48 m³ Hava Süspansiyonlu Evden Eve Kamyon
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 12 }}>
                 Uzun yol sarsıntılarını sıfıra indiren körüklü süspansiyon, askılı tekstil dolapları
                ve 5 kişilik kadrolu ekip.
              </p>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--navy)' }}>
                ✓ GPS Uydu Takibi · ✓ K3 Yetki Belgeli
              </div>
            </div>

            <div className="fleet-card">
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--blue-light)', color: 'var(--blue)', display: 'grid', placeItems: 'center', marginBottom: 14 }}>
                <Building2 size={24} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>
                18. KATA KADAR (56 METRE)
              </span>
              <h3 style={{ fontSize: 19, margin: '4px 0 8px' }}>
                Teleskopik Dış Cephe Eşya Taşıma Asansörü
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 12 }}>
                Bina merdivenlerine ve dar apartman asansörlerine hiç girmeden, balkon veya geniş
                pencereden sıfır çizikle indirme/çıkarma.
              </p>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--navy)' }}>
                ✓ %50 Daha Hızlı Taşıma · ✓ Komşu Rahatsızlığı Yok
              </div>
            </div>

            <div className="fleet-card">
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#FEF3C7', color: '#D97706', display: 'grid', placeItems: 'center', marginBottom: 14 }}>
                <Layers size={24} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#D97706' }}>
                4+1, VİLLA VE KURUMSAL OFİSLER
              </span>
              <h3 style={{ fontSize: 19, margin: '4px 0 8px' }}>
                62 - 80 m³ XXL Lüks Villa & Ofis Лоjistik Filosu
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 12 }}>
                Piyano, çelik kasa, server kabinleri ve antika mobilyalar için özel ahşap sandıklama
                ve 7 kişilik VIP ekip.
              </p>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--navy)' }}>
                ✓ 750.000 TL Sigorta · ✓ Ücretsiz Ekspertiz
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CUSTOMER REVIEWS ── */}
      <section id="yorumlar" className="section-alt">
        <div className="container">
          <div className="sec-head">
            <span className="sec-eyebrow">
              <Star size={14} /> Gerçek Müşteri Deneyimleri
            </span>
            <h2>Sihirbazla Fiyat Alıp Taşınan Ailelerimiz</h2>
            <p>Sürpriz ek ücret ödemeden, söz verilen saatte yeni yuvasına kavuşan müşterilerimiz.</p>
          </div>

          <div className="fleet-grid">
            {[
              {
                name: 'Burak & Selin Demir',
                route: 'İstanbul (Kadıköy) → Ankara (Çankaya) · 3+1',
                price: '36.700 ₺',
                text: 'Sitedeki fiyat hesaplama sihirbazında 3+1 ve 4. kat dış asansör seçtiğimde ne fiyat çıktıysa kuruşu kuruşuna aynı fiyata sözleşme yaptık. Tek bir bardak bile kırılmadı.',
              },
              {
                name: 'Merve Karahan',
                route: 'İzmir (Karşıyaka) → İzmir (Urla) · 2+1 VIP Paket',
                price: '22.200 ₺',
                text: 'VIP Gold paketi seçtim; mutfaktaki baharatlıklarımdan gardıroptaki elbiselerime kadar her şeyi askılı kolilerle topladılar. Yeni evde sadece kahvemi içtim.',
              },
              {
                name: 'Av. Kerem Soylu',
                route: 'İstanbul (Şişli) → Antalya (Konyaaltı) · Ofis & Ev',
                price: '39.400 ₺',
                text: 'Hukuk büromuzun arşiv dolaplarını ve evimizi aynı anda Antalya’ya taşıdılar. Takip koduyla kamyonun nerede olduğunu sürekli görebilmek harika bir güven.',
              },
            ].map((r) => (
              <div key={r.name} className="fleet-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ color: '#F59E0B', fontWeight: 800 }}>★★★★★ 5.0</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--emerald)', background: 'var(--emerald-light)', padding: '2px 8px', borderRadius: 99 }}>
                    Ödenen: {r.price}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--navy-700)', fontStyle: 'italic', marginBottom: 14 }}>
                  "{r.text}"
                </p>
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 14.5 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{r.route}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="container">
          <div className="footer__grid">
            <div>
              <div className="brand" style={{ marginBottom: 14 }}>
                <div className="brand__icon">
                  <Truck size={22} />
                </div>
                <div>
                  <div className="brand__title" style={{ color: '#fff' }}>
                    Comodo<span>Nakliyat</span>
                  </div>
                  <div className="brand__sub">Sigortalı Ev & Ofis Lojistiği</div>
                </div>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.65, marginBottom: 16 }}>
                81 ilde K3 yetki belgeli çelik kasa araç filosu, 18. kata kadar dış cephe mobil
                asansör sistemleri ve Allianz sigorta güvencesiyle anahtar teslim nakliyat.
              </p>
              <div style={{ fontSize: 13, color: '#FDBA74', fontWeight: 700 }}>
                📞 7/24 Çağrı & Ekspertiz: 0507 850 5287
              </div>
            </div>

            <div>
              <h4>Hızlı Erişim</h4>
              <ul>
                <li><a href="#fiyat-sihirbazi">Nakliyat Fiyat Hesaplama</a></li>
                <li><a href="#tasinma-takip">Taşınma Kodu Sorgulama</a></li>
                <li><a href="#arac-filomuz">Dış Cephe Asansör Kiralama</a></li>
                <li><a href="#paketler">VIP Gold Paketleme</a></li>
              </ul>
            </div>

            <div>
              <h4>Popüler Rotalar</h4>
              <ul>
                <li>İstanbul ↔ Ankara Evden Eve</li>
                <li>İstanbul ↔ İzmir Şehirler Arası</li>
                <li>İstanbul ↔ Antalya Sigortalı Nakliyat</li>
                <li>Ankara ↔ Bodrum / Muğla Villa Taşıma</li>
              </ul>
            </div>

            <div>
              <h4>Kurumsal Yazılım & Altyapı</h4>
              <p style={{ fontSize: 13, marginBottom: 10 }}>
                Bu akıllı nakliyat fiyat hesaplama ve rezervasyon platformu{' '}
                <strong style={{ color: '#fff' }}>Comodo Teknoloji</strong> tarafından Clean
                Architecture (.NET 9 + React TypeScript) mimarisiyle geliştirilmiştir.
              </p>
              <div style={{ fontSize: 13, color: '#38BDF8', fontWeight: 700 }}>
                🌐 comodoteknoloji.com · 0507 850 5287
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingTop: 24, fontSize: 13 }}>
            <span>© {new Date().getFullYear()} Comodo Nakliyat & Comodo Teknoloji ve Ticaret. Tüm hakları saklıdır.</span>
            <span>K3 Yetki Belgesi · Allianz Sigorta · ISO 9001 Kalite Standardı</span>
          </div>
        </div>
      </footer>

      {/* ── BOOKING MODAL ── */}
      {bookingOpen && (
        <div className="modal-backdrop" onClick={() => setBookingOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--brand)' }}>
                  SABİT FİYAT GARANTİLİ REZERVASYON
                </span>
                <h3 style={{ fontSize: 22 }}>
                  {createdBooking ? 'Rezervasyonunuz Oluşturuldu!' : 'Fiyatı Sabitle & Ekspertiz Planla'}
                </h3>
              </div>
              <button type="button" onClick={() => setBookingOpen(false)}>
                <X size={22} />
              </button>
            </div>

            {createdBooking ? (
              <div>
                <div style={{ background: 'var(--emerald-light)', border: '1.5px solid var(--emerald)', borderRadius: 16, padding: 18, textAlign: 'center', marginBottom: 18 }}>
                  <FileCheck2 size={36} color="var(--emerald)" style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
                    TAŞINMA TAKİP KODUNUZ
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)' }}>
                    {createdBooking.trackingCode}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--navy-700)' }}>
                    Sabitlenen Tutar: <strong>{formatTRY(createdBooking.estimatedPrice)}</strong> (
                    {formatTRY(createdBooking.insuranceCoverage)} Sigorta Dahil)
                  </div>
                </div>

                <div style={{ fontSize: 13.5, color: 'var(--navy-700)', marginBottom: 18, lineHeight: 1.6 }}>
                  <div>• <strong>Rota:</strong> {createdBooking.fromCity} ({createdBooking.fromDistrict}) → {createdBooking.toCity} ({createdBooking.toDistrict})</div>
                  <div>• <strong>Oda & Araç:</strong> {ROOM_TYPE_META[createdBooking.roomType].label} · {createdBooking.assignedVehicle}</div>
                  <div>• <strong>Taşınma Tarihi:</strong> {createdBooking.moveDate}</div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <a
                    href={`https://wa.me/905078505287?text=${encodeURIComponent(`Merhaba, #${createdBooking.trackingCode} takip koduyla ${createdBooking.fromCity} -> ${createdBooking.toCity} (${formatTRY(createdBooking.estimatedPrice)}) taşınma rezervasyonumu oluşturdum.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn--emerald btn--block"
                  >
                    <MessageCircle size={18} /> WhatsApp'tan Onay Al
                  </a>
                  <button
                    type="button"
                    className="btn btn--navy"
                    onClick={() => {
                      setBookingOpen(false)
                      document.getElementById('tasinma-takip')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    Canlı Takip Ekranına Git <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateBooking}>
                <div style={{ background: 'var(--bg)', padding: 14, borderRadius: 14, marginBottom: 16, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>
                      {ROOM_TYPE_META[quoteReq.roomType].label} · {quoteReq.fromCity} → {quoteReq.toCity}
                    </span>
                    <span style={{ color: 'var(--brand-hover)' }}>{formatTRY(breakdown.totalPrice)}</span>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>
                    {quoteReq.fromFloor}. Kat ({ELEVATOR_META[quoteReq.fromElevator].label}) →{' '}
                    {quoteReq.toFloor}. Kat ({ELEVATOR_META[quoteReq.toElevator].label}) ·{' '}
                    {PACKAGE_TIER_META[quoteReq.packageTier].name}
                  </div>
                </div>

                {formError && (
                  <div style={{ background: '#FEF2F2', color: '#991B1B', padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                    {formError}
                  </div>
                )}

                <div className="field-row">
                  <div className="field">
                    <label>Adınız Soyadınız *</label>
                    <input
                      className="input"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Örn: Mehmet Kaya"
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Telefon Numaranız *</label>
                    <input
                      className="input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05xx xxx xx xx"
                      required
                    />
                  </div>
                </div>

                <div className="field-row">
                  <div className="field">
                    <label>Planlanan Taşınma Tarihi</label>
                    <input
                      type="date"
                      className="input"
                      value={moveDate}
                      onChange={(e) => setMoveDate(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>E-Posta (Sigorta Poliçesi İçin)</label>
                    <input
                      type="email"
                      className="input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@eposta.com"
                    />
                  </div>
                </div>

                <div className="field" style={{ marginBottom: 16 }}>
                  <label>Ek Notlarınız (Antika eşya, site giriş saatleri vb.)</label>
                  <input
                    className="input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Örn: Siteye sabah 09:00'dan itibaren araç girişi yapılabiliyor."
                  />
                </div>

                <button type="submit" className="btn btn--primary btn--lg btn--block">
                  <Check size={18} /> {formatTRY(breakdown.totalPrice)} Fiyatı Sabitle & Takip Kodu Al
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
