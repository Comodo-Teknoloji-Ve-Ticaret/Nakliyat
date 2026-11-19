// Application katmanı port sözleşmeleri — UI yalnızca bu arayüzleri bilir.
import type {
  CalculateQuoteRequest,
  CityInfo,
  CreateBookingRequest,
  MovingBooking,
  PriceBreakdownResult,
} from '../domain/models'

export interface MovingServicePort {
  getCities(): Promise<CityInfo[]>
  getDistanceKm(fromCity: string, toCity: string): Promise<number>
  calculateQuote(request: CalculateQuoteRequest): Promise<PriceBreakdownResult>
  createBooking(request: CreateBookingRequest): Promise<MovingBooking>
  getBookingByCode(trackingCode: string): Promise<MovingBooking | null>
  getAllBookings(): Promise<MovingBooking[]>
}

export interface Services {
  moving: MovingServicePort
}
