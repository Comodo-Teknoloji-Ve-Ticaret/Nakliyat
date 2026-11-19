# 🚚 Comodo Nakliyat — Akıllı Evden Eve Nakliyat Fiyat Hesaplama Sihirbazı

Oda sayısı (`1+0`, `1+1`, `2+1`, `3+1`, `4+1`, `Villa`, `Ofis`), kat, asansör durumu ve 81 il şehir seçerek **10 saniyede anında nakliyat fiyatı hesaplayan**, sabit fiyat garantili rezervasyon ve **canlı taşınma takip kodu (`#CMD-2026-4820`)** üreten kurumsal nakliyat ve lojistik platformu.

| Katman | Teknoloji | Mimari |
| --- | --- | --- |
| **Frontend** | React 19 · TypeScript · Vite | Clean Architecture (`domain` · `application` · `infrastructure` · `presentation`) |
| **Backend** | .NET 9 · Minimal Web API · ProblemDetails | Clean Architecture (`Domain` · `Application` · `Infrastructure` · `WebApi`) |

---

## ✨ Temel Özellikler (Sektörel Satış Noktaları - USP)

1. **Oda Sayısı, Kat ve Şehir Seçmeli Anında Fiyat Hesaplama Sihirbazı:**
   - **7 Farklı Oda / Hacim Tipi:** `1+0 Stüdyo (14 m³)`, `1+1 (22 m³)`, `2+1 (34 m³)`, `3+1 (48 m³)`, `4+1 (62 m³)`, `5+1 Villa (80 m³)` ve `Kurumsal Ofis (40 m³)`.
   - **Şehir İçi & Şehirler Arası Mesafe Motoru:** Çıkış ve varış şehri aynıysa şehir içi tarife, farklıysa km ve oda hacmine göre şehirler arası mesafe maliyeti hesaplanır.
   - **Kat & Asansör Algoritması:** Bina asansörü, merdiven taşıması veya **18. kata kadar teleskopik dış cephe mobil asansör** seçimine göre otomatik maliyet ve ekipman planlaması.
   - **3 Ambalaj Paketi & Allianz Sigorta Teminatı:** *Ekonomik (200.000 TL Sigorta)*, *Standart Anahtar Teslim (400.000 TL Sigorta)* ve *VIP Gold El Sürmeden Taşın (750.000 TL Sigorta)*.
2. **Sabit Fiyat Garantili Rezervasyon & WhatsApp Entegrasyonu:**
   - Hesaplanan fiyat dökümünü tek tıkla sabitleyip `#CMD-2026-XXXX` takip kodu üretme veya tüm kalemleri hazır mesaj olarak doğrudan WhatsApp hattına (`0507 850 5287`) gönderme.
3. **Canlı Taşınma & Araç Takip Modülü:**
   - Müşterilerin takip koduyla (*Örn: `CMD-2026-4820`*) eşyalarının hangi aşamada olduğunu 6 adımlı zaman çizelgesinden canlı izlemesi.

---

## 🏗️ Proje Mimarisi (Clean Architecture)

```text
Nakliyat/
├── backend/                                  # .NET 9 Clean Architecture Solution
│   ├── ComodoNakliyat.sln
│   └── src/
│       ├── ComodoNakliyat.Domain/            # Entities (MovingBooking, CityInfo) & Rules (PricingCalculator)
│       ├── ComodoNakliyat.Application/       # Contracts & Ports (IMovingRepository, DTOs)
│       ├── ComodoNakliyat.Infrastructure/    # Persistence (InMemoryMovingRepository / EF Core Ready)
│       └── ComodoNakliyat.WebApi/            # REST Endpoints (/api/cities, /api/quotes/calculate, /api/bookings)
└── frontend/                                 # React 19 + TypeScript Clean Architecture
    └── src/
        ├── domain/                           # models.ts & rules.ts (PricingCalculator TS karşılığı)
        ├── application/                      # ports.ts (MovingServicePort sözleşmesi)
        ├── infrastructure/
        │   ├── mock/                         # Tarayıcı içi veri + localStorage adaptörü (GitHub Pages modu)
        │   ├── api/                          # .NET Web API HTTP adaptörü (VITE_DATA_SOURCE=api)
        │   └── container.ts                  # Composition Root
        └── App.tsx                           # Sihirbaz, Canlı Takip ve Filo Arayüzü
```

---

## 🚀 Çalıştırma

### Frontend (React + TypeScript)
```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # GitHub Pages için dist/ üretir
```

### Backend (.NET 9 Web API)
```bash
cd backend
dotnet run --project src/ComodoNakliyat.WebApi
```

---
© Comodo Teknoloji ve Ticaret · `comodoteknoloji.com` · `0507 850 5287`
