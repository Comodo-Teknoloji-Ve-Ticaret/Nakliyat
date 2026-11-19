// .NET Clean Architecture Web API adaptörü (VITE_DATA_SOURCE=api olduğunda aktifleşir)
import type { MovingServicePort, Services } from '../../application/ports'
import type {
  CalculateQuoteRequest,
  CityInfo,
  CreateBookingRequest,
  MovingBooking,
  PriceBreakdownResult,
} from '../../domain/models'
import { http } from '../http/httpClient'

const movingApi: MovingServicePort = {
  getCities: () => http.get<CityInfo[]>('/cities'),
  getDistanceKm: async (fromCity, toCity) => {
    const cities = await http.get<CityInfo[]>('/cities')
    if (fromCity.toLocaleLowerCase('tr') === toCity.toLocaleLowerCase('tr')) return 25
    const c1 = cities.find((c) => c.name === fromCity || c.id === fromCity)
    const c2 = cities.find((c) => c.name === toCity || c.id === toCity)
    if (!c1 || !c2) return 450
    const diff = Math.abs(c1.hubDistanceIndex - c2.hubDistanceIndex)
    return Math.max(140, diff === 0 ? 350 : diff + 95)
  },
  calculateQuote: (req: CalculateQuoteRequest) =>
    http.post<PriceBreakdownResult>('/quotes/calculate', req),
  createBooking: (req: CreateBookingRequest) =>
    http.post<MovingBooking>('/bookings', req),
  getBookingByCode: async (code: string) => {
    try {
      return await http.get<MovingBooking>(`/bookings/${encodeURIComponent(code)}`)
    } catch {
      return null
    }
  },
  getAllBookings: () => http.get<MovingBooking[]>('/bookings'),
}

export const apiServices: Services = {
  moving: movingApi,
}
