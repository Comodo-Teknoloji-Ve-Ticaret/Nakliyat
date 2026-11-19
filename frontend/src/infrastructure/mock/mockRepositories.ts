import type { MovingServicePort, Services } from '../../application/ports'
import type {
  CalculateQuoteRequest,
  CreateBookingRequest,
  MovingBooking,
} from '../../domain/models'
import { calculateMovingPrice } from '../../domain/rules'
import { SEED_BOOKINGS, SEED_CITIES } from './seed'

const STORAGE_KEY = 'comodo_nakliyat_bookings_v1'

function loadBookings(): MovingBooking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_BOOKINGS))
      return [...SEED_BOOKINGS]
    }
    return JSON.parse(raw) as MovingBooking[]
  } catch {
    return [...SEED_BOOKINGS]
  }
}

function saveBookings(list: MovingBooking[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

function computeDistanceKm(fromCity: string, toCity: string): number {
  if (fromCity.trim().toLocaleLowerCase('tr') === toCity.trim().toLocaleLowerCase('tr')) {
    return 25
  }
  const c1 = SEED_CITIES.find(
    (c) => c.name.toLocaleLowerCase('tr') === fromCity.toLocaleLowerCase('tr') || c.id === fromCity,
  )
  const c2 = SEED_CITIES.find(
    (c) => c.name.toLocaleLowerCase('tr') === toCity.toLocaleLowerCase('tr') || c.id === toCity,
  )
  if (!c1 || !c2) return 450
  const diff = Math.abs(c1.hubDistanceIndex - c2.hubDistanceIndex)
  return Math.max(140, diff === 0 ? 350 : diff + 95)
}

const mockMovingService: MovingServicePort = {
  getCities: async () => SEED_CITIES,

  getDistanceKm: async (fromCity: string, toCity: string) =>
    computeDistanceKm(fromCity, toCity),

  calculateQuote: async (request: CalculateQuoteRequest) => {
    const dist = computeDistanceKm(request.fromCity, request.toCity)
    return calculateMovingPrice(request, dist)
  },

  createBooking: async (request: CreateBookingRequest) => {
    const dist = computeDistanceKm(request.quote.fromCity, request.quote.toCity)
    const breakdown = calculateMovingPrice(request.quote, dist)
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const code = `CMD-2026-${randomNum}`

    const newBooking: MovingBooking = {
      id: `b-${Date.now()}`,
      trackingCode: code,
      customerName: request.customerName.trim(),
      phone: request.phone.trim(),
      email: request.email.trim(),
      fromCity: request.quote.fromCity,
      fromDistrict: request.quote.fromDistrict,
      fromFloor: request.quote.fromFloor,
      fromElevator: request.quote.fromElevator,
      toCity: request.quote.toCity,
      toDistrict: request.quote.toDistrict,
      toFloor: request.quote.toFloor,
      toElevator: request.quote.toElevator,
      roomType: request.quote.roomType,
      packageTier: request.quote.packageTier,
      extras: {
        disassemblyAssembly: true,
        kitchenFragilePacking: request.quote.kitchenPacking,
        pianoOrSafeBox: request.quote.pianoOrSafe,
        storageDays30: request.quote.storage30Days,
      },
      moveDate: request.moveDate,
      estimatedPrice: breakdown.totalPrice,
      insuranceCoverage: breakdown.insuranceCoverageLimit,
      assignedVehicle: breakdown.recommendedVehicle,
      crewSize: breakdown.crewSize,
      status: 'ExpertAssigned',
      notes: request.notes.trim() || 'Standart sigortalı evden eve nakliyat planlaması.',
      createdAtUtc: new Date().toISOString(),
    }

    const list = loadBookings()
    list.unshift(newBooking)
    saveBookings(list)
    return newBooking
  },

  getBookingByCode: async (trackingCode: string) => {
    const list = loadBookings()
    const clean = trackingCode.trim().toLocaleUpperCase('tr')
    return (
      list.find((b) => b.trackingCode.toLocaleUpperCase('tr') === clean) ?? null
    )
  },

  getAllBookings: async () => loadBookings(),
}

export const mockServices: Services = {
  moving: mockMovingService,
}
