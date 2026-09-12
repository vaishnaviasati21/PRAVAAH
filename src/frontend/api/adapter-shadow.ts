/* ==========================================================================
   PILGRIMOS SHADOW ADAPTER
   Deterministic, progressive mock adapter for hackathon demonstrations
   ========================================================================== */

import type { PilgrimosApiAdapter } from './adapter-interface.js';
import type {
  PilgrimageRequest,
  AgentStatus,
  JourneyPlan,
  AvailabilityResult,
  ApprovalRequest,
  ApprovalResponse,
  AppUiState,
} from '../types/index.js';

interface ShadowSession {
  request: PilgrimageRequest;
  status: AgentStatus;
  plan: JourneyPlan | null;
  availability: AvailabilityResult | null;
  approval: ApprovalRequest | null;
  stepIndex: number;
}

export class ShadowPilgrimosAdapter implements PilgrimosApiAdapter {
  readonly modeName = 'shadow' as const;
  private sessions: Map<string, ShadowSession> = new Map();
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  async createPilgrimageRequest(
    input: Omit<PilgrimageRequest, 'id' | 'createdAt'>
  ): Promise<PilgrimageRequest> {
    const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const request: PilgrimageRequest = {
      ...input,
      id,
      createdAt: new Date().toISOString(),
    };

    const initialStatus: AgentStatus = {
      requestId: id,
      stageName: 'Understanding your pilgrimage requirements',
      uiState: 'PLANNING',
      progressPercent: 10,
      message: `Analyzing route from ${input.originCity} to ${input.destinationTemple} for ${input.travelers} traveler(s)...`,
      logs: [
        {
          timestamp: this.formatTime(),
          level: 'info',
          message: `Request received: ${input.originCity} → ${input.destinationTemple}`,
        },
        {
          timestamp: this.formatTime(),
          level: 'info',
          message: `Parsed constraints: Senior darshan=${Boolean(input.constraints.seniorCitizenDarshan)}, Wheelchair=${Boolean(input.constraints.wheelchairAccess)}`,
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    const session: ShadowSession = {
      request,
      status: initialStatus,
      plan: null,
      availability: null,
      approval: null,
      stepIndex: 0,
    };

    this.sessions.set(id, session);
    this.scheduleExecutionStages(id);

    return request;
  }

  async getAgentStatus(requestId: string): Promise<AgentStatus> {
    const session = this.sessions.get(requestId);
    if (!session) {
      throw new Error(`Session ${requestId} not found in shadow adapter`);
    }
    return { ...session.status };
  }

  async getJourneyPlan(requestId: string): Promise<JourneyPlan | null> {
    const session = this.sessions.get(requestId);
    return session?.plan ?? null;
  }

  async getAvailability(requestId: string): Promise<AvailabilityResult | null> {
    const session = this.sessions.get(requestId);
    return session?.availability ?? null;
  }

  async getApprovalRequest(requestId: string): Promise<ApprovalRequest | null> {
    const session = this.sessions.get(requestId);
    return session?.approval ?? null;
  }

  async submitApproval(requestId: string): Promise<ApprovalResponse> {
    const session = this.sessions.get(requestId);
    if (!session) {
      throw new Error(`Session ${requestId} not found`);
    }

    session.status.uiState = 'APPROVED';
    session.status.progressPercent = 95;
    session.status.stageName = 'Human approval confirmed';
    session.status.message = 'Approval verified. Dispatched autonomous transaction intent to booking queue.';
    session.status.logs.push({
      timestamp: this.formatTime(),
      level: 'success',
      message: 'Human approval intent received. Autonomous safety gate unlocked.',
    });

    setTimeout(() => {
      session.status.uiState = 'COMPLETED';
      session.status.progressPercent = 100;
      session.status.stageName = 'Pilgrimage journey finalized & synchronized';
      session.status.message = 'All bookings & darshan passes reserved. Safe and blessed journey!';
      session.status.logs.push({
        timestamp: this.formatTime(),
        level: 'success',
        message: 'PNR & Temple Entry Pass confirmed: TT-8849201-DARSHAN',
      });
    }, 1800);

    return {
      requestId,
      decision: 'approved',
      processedAt: new Date().toISOString(),
    };
  }

  async submitRejection(requestId: string, reason?: string): Promise<ApprovalResponse> {
    const session = this.sessions.get(requestId);
    if (!session) {
      throw new Error(`Session ${requestId} not found`);
    }

    session.status.uiState = 'REJECTED';
    session.status.stageName = 'Pilgrimage plan rejected by user';
    session.status.message = reason
      ? `Action cancelled by human: ${reason}`
      : 'User rejected the booking action. Autonomous agent safely halted.';
    session.status.logs.push({
      timestamp: this.formatTime(),
      level: 'warn',
      message: 'Approval rejected by human operator. Zero financial or booking actions performed.',
    });

    return {
      requestId,
      decision: 'rejected',
      processedAt: new Date().toISOString(),
      reason,
    };
  }

  async cancelPilgrimage(requestId: string): Promise<void> {
    const timer = this.timers.get(requestId);
    if (timer) clearTimeout(timer);
    this.sessions.delete(requestId);
  }

  // --- Progressive Simulation Engine ---
  private scheduleExecutionStages(requestId: string) {
    const stages: Array<{
      uiState: AppUiState;
      delay: number;
      progress: number;
      stageName: string;
      message: string;
      log: { level: 'info' | 'warn' | 'success'; message: string };
      action?: (session: ShadowSession) => void;
    }> = [
      {
        uiState: 'RESEARCHING',
        delay: 1200,
        progress: 25,
        stageName: 'Searching transport connections',
        message: 'Querying high-speed trains, airlines, and inter-city EV cabs...',
        log: {
          level: 'info',
          message: 'Found 3 direct train routes and 2 flight schedules matching requested arrival window.',
        },
      },
      {
        uiState: 'RESEARCHING',
        delay: 2600,
        progress: 45,
        stageName: 'Checking accommodation & Dharamshalas',
        message: 'Scanning verified temple trust rest houses and nearby hotels...',
        log: {
          level: 'info',
          message: 'Retrieved availability for Trust Guest House (400m from main temple gate).',
        },
      },
      {
        uiState: 'RESEARCHING',
        delay: 4200,
        progress: 65,
        stageName: 'Checking darshan availability across official portals',
        message: 'Scanning official temple trust quota & special entry time slots...',
        log: {
          level: 'info',
          message: 'Special Entry Darshan slots available: 07:00 AM and 04:30 PM.',
        },
      },
      {
        uiState: 'RESEARCHING',
        delay: 5800,
        progress: 80,
        stageName: 'Forecasting crowd levels & historical footfall',
        message: 'Running ML footfall models on tithi, festivals, and weekend rush...',
        log: {
          level: 'info',
          message: 'Crowd model: Low to Moderate on Day 1, Expected Darshan queue: ~45 mins.',
        },
      },
      {
        uiState: 'RESULTS_READY',
        delay: 7400,
        progress: 90,
        stageName: 'Itinerary compiled & optimized',
        message: 'Comprehensive journey plan ready. Preparing booking package for human verification.',
        log: {
          level: 'success',
          message: 'Complete pilgrimage plan assembled. Enforcing Human-in-the-Loop approval barrier.',
        },
        action: (session) => {
          this.populateData(session);
        },
      },
      {
        uiState: 'APPROVAL_REQUIRED',
        delay: 9200,
        progress: 92,
        stageName: 'Action requires explicit human approval',
        message: 'Agent has prepared ticket & slot reservations. The agent will NOT proceed without your approval.',
        log: {
          level: 'warn',
          message: 'SAFETY GATE LOCKED: Awaiting explicit Approve/Reject decision.',
        },
        action: (session) => {
          this.populateApproval(session);
        },
      },
    ];

    stages.forEach((stage) => {
      const timer = setTimeout(() => {
        const session = this.sessions.get(requestId);
        if (!session) return;
        session.status.uiState = stage.uiState;
        session.status.progressPercent = stage.progress;
        session.status.stageName = stage.stageName;
        session.status.message = stage.message;
        session.status.updatedAt = new Date().toISOString();
        session.status.logs.push({
          timestamp: this.formatTime(),
          level: stage.log.level,
          message: stage.log.message,
        });
        if (stage.action) {
          stage.action(session);
        }
      }, stage.delay);

      this.timers.set(requestId, timer);
    });
  }

  private populateData(session: ShadowSession) {
    const req = session.request;
    const isVaranasi = req.destinationTemple.toLowerCase().includes('varanasi') ||
      req.destinationTemple.toLowerCase().includes('kashi');
    const isTirupati = req.destinationTemple.toLowerCase().includes('tirupati') ||
      req.destinationTemple.toLowerCase().includes('venkateswara');

    if (isTirupati) {
      this.populateTirupati(session);
    } else {
      this.populateVaranasi(session);
    }
  }

  private populateVaranasi(session: ShadowSession) {
    const req = session.request;
    const travelers = req.travelers || 2;
    const transportCost = 1850 * travelers;
    const stayCost = 3200;
    const darshanCost = 500 * travelers;
    const localCost = 1200;
    const totalCost = transportCost + stayCost + darshanCost + localCost;

    session.plan = {
      id: `plan_${session.request.id}`,
      requestId: session.request.id,
      title: `Kashi Vishwanath Sacred Yatra (${req.originCity} → Varanasi)`,
      totalEstimatedCostInr: totalCost,
      recommendedTransport: {
        id: 'tr-01',
        mode: 'train',
        provider: 'Vande Bharat Express (22436)',
        departureTime: '06:00 AM (New Delhi)',
        arrivalTime: '02:00 PM (Varanasi Jn)',
        duration: '8h 00m',
        priceInr: transportCost,
        availableSeats: 34,
        serviceClass: 'AC Chair Car (CC)',
      },
      recommendedAccommodation: {
        id: 'acc-01',
        name: 'Kashi Vishwanath Corridor Guest House',
        type: 'temple_trust',
        distanceFromTempleKm: 0.3,
        roomType: 'Deluxe AC Room (Temple View)',
        pricePerNightInr: stayCost,
        availableRooms: 6,
        amenities: ['Satvik Bhojanalaya', 'Wheelchair Access', '24/7 Hot Water', 'Luggage Cloakroom'],
        rating: 4.8,
      },
      crowdForecasts: [
        {
          date: req.startDate || '2026-09-15',
          crowdLevel: 'moderate',
          expectedWaitHours: 0.8,
          darshanSlotsRemaining: 42,
          vipDarshanAvailable: true,
        },
        {
          date: req.endDate || '2026-09-16',
          crowdLevel: 'low',
          expectedWaitHours: 0.4,
          darshanSlotsRemaining: 88,
          vipDarshanAvailable: true,
        },
      ],
      nearbyAlternatives: [
        {
          id: 'alt-01',
          name: 'Kaal Bhairav Temple (Kotwal of Kashi)',
          distanceKm: 1.8,
          travelTime: '10 mins by e-rickshaw',
          keyDeity: 'Lord Kaal Bhairav',
          crowdLevel: 'moderate',
          reason: 'Traditional ritual necessity to visit before or after Vishwanath darshan.',
        },
        {
          id: 'alt-02',
          name: 'Sarnath Deer Park & Dhamek Stupa',
          distanceKm: 10.2,
          travelTime: '25 mins by cab',
          keyDeity: 'Lord Buddha / Ancient Stupa',
          crowdLevel: 'low',
          reason: 'Serene spiritual sanctuary with zero rush; excellent peaceful retreat.',
        },
        {
          id: 'alt-03',
          name: 'Sankat Mochan Hanuman Mandir',
          distanceKm: 3.5,
          travelTime: '15 mins',
          keyDeity: 'Lord Hanuman (Tulsidas Consecrated)',
          crowdLevel: 'moderate',
          reason: 'Renowned for divine prasadam and peaceful evening sankirtan.',
        },
      ],
      itinerary: [
        {
          day: 1,
          date: req.startDate || '2026-09-15',
          title: 'Arrival, Ghat Sanctification & Ganga Aarti',
          activities: [
            {
              time: '02:00 PM',
              title: 'Arrival at Varanasi Cantt (BSB)',
              description: 'Pre-arranged pre-paid cab transit directly to Godowlia Crossing.',
              location: 'Varanasi Junction',
            },
            {
              time: '03:30 PM',
              title: 'Check-in & Rest',
              description: 'Settle into Kashi Vishwanath Corridor Guest House with Satvik lunch.',
              location: 'Kashi Corridor',
            },
            {
              time: '05:30 PM',
              title: 'Private Boat to Dashashwamedh Ghat',
              description: 'Reserved bajra boat for panoramic view of the world-famous evening Maha Aarti.',
              location: 'Dashashwamedh Ghat',
            },
          ],
        },
        {
          day: 2,
          date: req.endDate || '2026-09-16',
          title: 'Mangala Darshan, Corridor Parikrama & Sacred Return',
          activities: [
            {
              time: '06:30 AM',
              title: 'Sugam Special Entry Darshan',
              description: 'Direct priority corridor access via Gate 4 (dedicated senior/priority queue).',
              location: 'Kashi Vishwanath Sanctum',
              isDarshan: true,
            },
            {
              time: '09:00 AM',
              title: 'Annapurna Mandir & Vishalakshi Shaktipeeth',
              description: 'Walking parikrama inside the historic lanes adjoining the corridor.',
              location: 'Temple Precincts',
            },
            {
              time: '01:30 PM',
              title: 'Return Journey Departure',
              description: 'Transfer to Varanasi Cantt for return Vande Bharat Express.',
              location: 'Varanasi Junction',
            },
          ],
        },
      ],
      notes: [
        'Electronic gadgets and leather items are strictly prohibited inside the sanctum sanctorum.',
        'Dedicated senior citizen battery carts available between Godowlia and Gate 4.',
        'Carry physical government ID cards (Aadhaar/Passport) matching darshan pass names.',
      ],
    };

    session.availability = {
      requestId: session.request.id,
      transports: [
        session.plan.recommendedTransport,
        {
          id: 'tr-02',
          mode: 'flight',
          provider: 'IndiGo (6E-2041)',
          departureTime: '09:15 AM (DEL T2)',
          arrivalTime: '10:45 AM (VNS)',
          duration: '1h 30m',
          priceInr: 3950 * travelers,
          availableSeats: 12,
          serviceClass: 'Economy',
        },
      ],
      accommodations: [
        session.plan.recommendedAccommodation,
        {
          id: 'acc-02',
          name: 'BrijRama Palace Heritage',
          type: 'hotel',
          distanceFromTempleKm: 0.6,
          roomType: 'Heritage Suite',
          pricePerNightInr: 12500,
          availableRooms: 2,
          amenities: ['Private Ghat Boat', 'Heritage Architecture', 'Pure Vegetarian Cuisine'],
          rating: 4.9,
        },
      ],
      crowdForecasts: session.plan.crowdForecasts,
      darshanSlots: [
        {
          temple: 'Kashi Vishwanath Jyotirlinga',
          date: req.startDate || '2026-09-15',
          slots: [
            { slotTime: '06:30 AM - 07:30 AM', availableCount: 18, quotaType: 'Sugam Darshan' },
            { slotTime: '11:00 AM - 12:00 PM', availableCount: 5, quotaType: 'General Slot' },
            { slotTime: '04:30 PM - 05:30 PM', availableCount: 26, quotaType: 'Sugam Darshan' },
          ],
        },
      ],
    };
  }

  private populateTirupati(session: ShadowSession) {
    const req = session.request;
    const travelers = req.travelers || 2;
    const transportCost = 2100 * travelers;
    const stayCost = 2400;
    const darshanCost = 300 * travelers;
    const localCost = 1500;
    const totalCost = transportCost + stayCost + darshanCost + localCost;

    session.plan = {
      id: `plan_${session.request.id}`,
      requestId: session.request.id,
      title: `Tirumala Balaji Special Entry Darshan (${req.originCity} → Tirupati)`,
      totalEstimatedCostInr: totalCost,
      recommendedTransport: {
        id: 'tr-ttd-01',
        mode: 'train',
        provider: 'Vande Bharat Express (20677)',
        departureTime: '05:30 AM (Bengaluru Cantt)',
        arrivalTime: '08:45 AM (Tirupati Main)',
        duration: '3h 15m',
        priceInr: transportCost,
        availableSeats: 48,
        serviceClass: 'AC Chair Car',
      },
      recommendedAccommodation: {
        id: 'acc-ttd-01',
        name: 'TTD Srinivasam Complex Rest House',
        type: 'temple_trust',
        distanceFromTempleKm: 0.2,
        roomType: 'AC Suite (Shrine Board)',
        pricePerNightInr: stayCost,
        availableRooms: 14,
        amenities: ['Direct Ghat Road Shuttle', 'Laddu Prasadam Counter', '24/7 Temple Helpdesk'],
        rating: 4.7,
      },
      crowdForecasts: [
        {
          date: req.startDate || '2026-09-18',
          crowdLevel: 'moderate',
          expectedWaitHours: 2.5,
          darshanSlotsRemaining: 65,
          vipDarshanAvailable: true,
        },
        {
          date: req.endDate || '2026-09-19',
          crowdLevel: 'high',
          expectedWaitHours: 4.0,
          darshanSlotsRemaining: 15,
          vipDarshanAvailable: false,
        },
      ],
      nearbyAlternatives: [
        {
          id: 'alt-ttd-01',
          name: 'Sri Kalahasti Rahu-Ketu Kshetram',
          distanceKm: 36,
          travelTime: '45 mins by direct cab',
          keyDeity: 'Lord Shiva (Vayu Lingam)',
          crowdLevel: 'low',
          reason: 'Vayu Linga darshan with swift line (under 30 mins) if Tirumala queues peak.',
        },
        {
          id: 'alt-ttd-02',
          name: 'Kanipakam Sri Varasiddhi Vinayaka Temple',
          distanceKm: 68,
          travelTime: '1h 15m',
          keyDeity: 'Self-manifested Lord Ganesha',
          crowdLevel: 'moderate',
          reason: 'Historic well temple; excellent morning visit before afternoon Tirumala darshan.',
        },
      ],
      itinerary: [
        {
          day: 1,
          date: req.startDate || '2026-09-18',
          title: 'Arrival & Scenic Ghat Ascent to Tirumala',
          activities: [
            {
              time: '08:45 AM',
              title: 'Arrival at Tirupati Railway Station',
              description: 'Reception and boarding dedicated electric ghat road transit.',
              location: 'Tirupati Station',
            },
            {
              time: '10:30 AM',
              title: 'Tirumala Hill Check-in',
              description: 'Check-in to TTD Srinivasam Suite, tonsure ritual (Kalyanakatta) assistance.',
              location: 'Tirumala Hills',
            },
            {
              time: '02:00 PM',
              title: 'Special Entry Darshan (₹300 Seva Q)',
              description: 'Entry via Vaikuntam Queue Complex 2 with verified digital barcode pass.',
              location: 'Ananda Nilayam Sanctum',
              isDarshan: true,
            },
          ],
        },
      ],
      notes: [
        'Strict traditional dress code: Dhoti/Kurta for men, Saree/Chudidar for women.',
        'Aadhaar verification is mandatory at Vaikuntam entrance.',
      ],
    };

    session.availability = {
      requestId: session.request.id,
      transports: [session.plan.recommendedTransport],
      accommodations: [session.plan.recommendedAccommodation],
      crowdForecasts: session.plan.crowdForecasts,
      darshanSlots: [
        {
          temple: 'Sri Venkateswara Temple, Tirumala',
          date: req.startDate || '2026-09-18',
          slots: [
            { slotTime: '02:00 PM - 03:00 PM', availableCount: 45, quotaType: 'Special Entry Darshan (₹300)' },
            { slotTime: '05:00 PM - 06:00 PM', availableCount: 20, quotaType: 'Special Entry Darshan (₹300)' },
          ],
        },
      ],
    };
  }

  private populateApproval(session: ShadowSession) {
    if (!session.plan) return;
    const req = session.request;
    const travelers = req.travelers || 2;
    const plan = session.plan;

    session.approval = {
      id: `appr_${session.request.id}`,
      requestId: session.request.id,
      action: 'CONFIRM_DARSHAN_AND_TRANSIT_BOOKING',
      summary: `Autonomous agent prepared booking reservation for ${travelers} pilgrim(s) to ${req.destinationTemple}`,
      route: `${req.originCity} → ${req.destinationTemple}`,
      travelDates: `${req.startDate} to ${req.endDate}`,
      travelersCount: travelers,
      breakdown: [
        { item: `${plan.recommendedTransport.provider} (${travelers} seats)`, costInr: plan.recommendedTransport.priceInr },
        { item: `${plan.recommendedAccommodation.name} (1 night)`, costInr: plan.recommendedAccommodation.pricePerNightInr },
        { item: `Official Temple Trust Darshan Entry Passes (${travelers}x)`, costInr: 500 * travelers },
        { item: 'Local e-transit & pilgrimage insurance', costInr: 1200 },
      ],
      totalCostInr: plan.totalEstimatedCostInr,
      consequences: [
        'Reserves official temple trust entry slots in the names of the travelers.',
        'Issues rail/transit booking confirmations.',
        'Generates unified PilgrimOS offline pass with emergency helpline numbers.',
      ],
      requiredBy: 'Human Operator (Safe Agent Execution Boundary)',
    };
  }

  private formatTime(): string {
    const now = new Date();
    return now.toTimeString().split(' ')[0] ?? '12:00:00';
  }
}
