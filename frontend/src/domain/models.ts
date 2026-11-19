// Saf domain modelleri — .NET ComodoNakliyat.Domain katmanı ile birebir eşleşir.

export type RoomType =
  | 'OnePlusZero'
  | 'OnePlusOne'
  | 'TwoPlusOne'
  | 'ThreePlusOne'
  | 'FourPlusOne'
  | 'VillaDuplex'
  | 'Office'

export type ElevatorType =
  | 'BuildingElevator'
  | 'StairsOnly'
  | 'MobileLift'

export type PackageTier =
  | 'Economic'
  | 'Standard'
  | 'Vip'

export type BookingStatus =
  | 'Received'
  | 'ExpertAssigned'
  | 'VehicleDispatched'
  | 'LoadingCompleted'
  | 'InTransit'
  | 'Delivered'

export interface CityInfo {
  id: string
  name: string
  region: string
  hubDistanceIndex: number
  popularDistricts: string[]
}

export interface CalculateQuoteRequest {
  roomType: RoomType
  fromCity: string
  fromDistrict: string
  fromFloor: number
  fromElevator: ElevatorType
  toCity: string
  toDistrict: string
  toFloor: number
  toElevator: ElevatorType
  packageTier: PackageTier
  kitchenPacking: boolean
  pianoOrSafe: boolean
  storage30Days: boolean
}

export interface PriceBreakdownResult {
  baseRoomPrice: number
  distanceCost: number
  floorAndElevatorCost: number
  packageCost: number
  extrasCost: number
  totalPrice: number
  minEstimate: number
  maxEstimate: number
  estimatedDistanceKm: number
  volumeCubicMeters: number
  crewSize: number
  recommendedVehicle: string
  estimatedDuration: string
  insuranceCoverageLimit: number
}

export interface MoveExtras {
  disassemblyAssembly: boolean
  kitchenFragilePacking: boolean
  pianoOrSafeBox: boolean
  storageDays30: boolean
}

export interface MovingBooking {
  id: string
  trackingCode: string
  customerName: string
  phone: string
  email: string
  fromCity: string
  fromDistrict: string
  fromFloor: number
  fromElevator: ElevatorType
  toCity: string
  toDistrict: string
  toFloor: number
  toElevator: ElevatorType
  roomType: RoomType
  packageTier: PackageTier
  extras: MoveExtras
  moveDate: string
  estimatedPrice: number
  insuranceCoverage: number
  assignedVehicle: string
  crewSize: number
  status: BookingStatus
  notes: string
  createdAtUtc: string
}

export interface CreateBookingRequest {
  customerName: string
  phone: string
  email: string
  moveDate: string
  notes: string
  quote: CalculateQuoteRequest
}
