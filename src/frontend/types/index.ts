/* ==========================================================================
   PILGRIMOS TYPED CONTRACTS & DOMAIN MODELS
   ========================================================================== */

export type AppUiState =
  | 'IDLE'
  | 'PLANNING'
  | 'RESEARCHING'
  | 'RESULTS_READY'
  | 'APPROVAL_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'FAILED';

export type BudgetTier = 'budget' | 'standard' | 'premium';

export interface PilgrimageConstraints {
  seniorCitizenDarshan?: boolean;
  wheelchairAccess?: boolean;
  fastingOrSatvikFood?: boolean;
  nearbyAlternativeTemplesOk?: boolean;
  maxTransitHours?: number;
}

export interface PilgrimageRequest {
  id: string;
  originCity: string;
  destinationTemple: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budgetTier: BudgetTier;
  constraints: PilgrimageConstraints;
  createdAt: string;
}

export type AgentLogLevel = 'info' | 'warn' | 'success' | 'error';

export interface AgentLogEntry {
  timestamp: string;
  level: AgentLogLevel;
  message: string;
}

export interface AgentStatus {
  requestId: string;
  stageName: string;
  uiState: AppUiState;
  progressPercent: number;
  message: string;
  logs: AgentLogEntry[];
  updatedAt: string;
}

export interface TransportOption {
  id: string;
  mode: 'flight' | 'train' | 'cab' | 'bus';
  provider: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  priceInr: number;
  availableSeats: number;
  serviceClass: string;
}

export interface AccommodationOption {
  id: string;
  name: string;
  type: 'dharamshala' | 'temple_trust' | 'hotel' | 'resort';
  distanceFromTempleKm: number;
  roomType: string;
  pricePerNightInr: number;
  availableRooms: number;
  amenities: string[];
  rating: number;
}

export interface CrowdForecast {
  date: string;
  crowdLevel: 'low' | 'moderate' | 'high' | 'extreme';
  expectedWaitHours: number;
  darshanSlotsRemaining: number;
  vipDarshanAvailable: boolean;
}

export interface AlternativeTemple {
  id: string;
  name: string;
  distanceKm: number;
  travelTime: string;
  keyDeity: string;
  crowdLevel: 'low' | 'moderate' | 'high';
  reason: string;
}

export interface ItineraryActivity {
  time: string;
  title: string;
  description: string;
  location?: string;
  isDarshan?: boolean;
}

export interface ItineraryDay {
  day: number;
  date: string;
  title: string;
  activities: ItineraryActivity[];
}

export interface JourneyPlan {
  id: string;
  requestId: string;
  title: string;
  totalEstimatedCostInr: number;
  itinerary: ItineraryDay[];
  recommendedTransport: TransportOption;
  recommendedAccommodation: AccommodationOption;
  crowdForecasts: CrowdForecast[];
  nearbyAlternatives: AlternativeTemple[];
  notes: string[];
}

export interface DarshanSlotGroup {
  temple: string;
  date: string;
  slots: Array<{
    slotTime: string;
    availableCount: number;
    quotaType: string;
  }>;
}

export interface AvailabilityResult {
  requestId: string;
  transports: TransportOption[];
  accommodations: AccommodationOption[];
  crowdForecasts: CrowdForecast[];
  darshanSlots: DarshanSlotGroup[];
}

export interface CostBreakdownItem {
  item: string;
  costInr: number;
}

export interface ApprovalRequest {
  id: string;
  requestId: string;
  action: string;
  summary: string;
  route: string;
  travelDates: string;
  travelersCount: number;
  breakdown: CostBreakdownItem[];
  totalCostInr: number;
  consequences: string[];
  requiredBy: string;
}

export interface ApprovalResponse {
  requestId: string;
  decision: 'approved' | 'rejected';
  processedAt: string;
  reason?: string;
}

export interface AgentError {
  code: string;
  message: string;
  recoverable: boolean;
  suggestedAction?: string;
}
