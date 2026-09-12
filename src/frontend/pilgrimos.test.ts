/* ==========================================================================
   PILGRIMOS FRONTEND TESTS
   Validates form validation, adapter state machine, HITL safety boundary,
   and switching layer.
   ========================================================================== */

import { describe, it, expect } from 'vitest';
import { validateForm } from './components/RequestForm.js';
import { ShadowPilgrimosAdapter } from './api/adapter-shadow.js';
import { SourcePilgrimosAdapter } from './api/adapter-source.js';
import { apiClient } from './api/client.js';
import { renderStepper } from './components/Stepper.js';
import { renderHitlApproval } from './components/HitlApprovalModal.js';
import { renderJourneyPlan } from './components/JourneyPlanView.js';
import type { ApprovalRequest, JourneyPlan } from './types/index.js';

describe('PilgrimOS Form Validation', () => {
  it('validates a correct pilgrimage input without errors', () => {
    const valid = {
      originCity: 'New Delhi',
      destinationTemple: 'Varanasi (Kashi Vishwanath Jyotirlinga)',
      startDate: '2026-09-15',
      endDate: '2026-09-17',
      travelers: 2,
    };
    const errors = validateForm(valid);
    expect(Object.keys(errors).length).toBe(0);
  });

  it('catches missing or short origin cities', () => {
    const invalid = {
      originCity: 'D',
      destinationTemple: 'Varanasi',
      startDate: '2026-09-15',
      endDate: '2026-09-17',
      travelers: 2,
    };
    const errors = validateForm(invalid);
    expect(errors.originCity).toBeDefined();
  });

  it('rejects return date earlier than start date', () => {
    const invalid = {
      originCity: 'Bengaluru',
      destinationTemple: 'Tirupati (Sri Venkateswara Swami, Tirumala)',
      startDate: '2026-09-20',
      endDate: '2026-09-18',
      travelers: 2,
    };
    const errors = validateForm(invalid);
    expect(errors.endDate).toContain('Return date cannot be earlier');
  });

  it('validates pilgrim count boundary constraints', () => {
    const zeroTravelers = validateForm({
      originCity: 'Delhi',
      destinationTemple: 'Varanasi',
      startDate: '2026-09-15',
      endDate: '2026-09-17',
      travelers: 0,
    });
    expect(zeroTravelers.travelers).toBeDefined();

    const excessiveTravelers = validateForm({
      originCity: 'Delhi',
      destinationTemple: 'Varanasi',
      startDate: '2026-09-15',
      endDate: '2026-09-17',
      travelers: 25,
    });
    expect(excessiveTravelers.travelers).toContain('Temple Trust Group Desk');
  });
});

describe('PilgrimOS Shadow Adapter & Progressive Simulation', () => {
  it('initializes a pilgrimage request in PLANNING state', async () => {
    const adapter = new ShadowPilgrimosAdapter();
    const req = await adapter.createPilgrimageRequest({
      originCity: 'New Delhi',
      destinationTemple: 'Varanasi (Kashi Vishwanath Jyotirlinga)',
      startDate: '2026-09-15',
      endDate: '2026-09-17',
      travelers: 2,
      budgetTier: 'standard',
      constraints: {
        seniorCitizenDarshan: true,
        wheelchairAccess: false,
        fastingOrSatvikFood: true,
        nearbyAlternativeTemplesOk: true,
      },
    });

    expect(req.id).toMatch(/^req_/);
    const status = await adapter.getAgentStatus(req.id);
    expect(status.uiState).toBe('PLANNING');
    expect(status.progressPercent).toBe(10);
    expect(status.logs.length).toBeGreaterThan(0);
  });

  it('enforces human approval requirement before finalizing', async () => {
    const adapter = new ShadowPilgrimosAdapter();
    const req = await adapter.createPilgrimageRequest({
      originCity: 'Bengaluru',
      destinationTemple: 'Tirupati (Sri Venkateswara Swami, Tirumala)',
      startDate: '2026-09-18',
      endDate: '2026-09-20',
      travelers: 3,
      budgetTier: 'premium',
      constraints: {
        seniorCitizenDarshan: true,
        nearbyAlternativeTemplesOk: true,
      },
    });

    // Fast-forward or await progress
    await new Promise((r) => setTimeout(r, 9500));

    const status = await adapter.getAgentStatus(req.id);
    expect(status.uiState).toBe('APPROVAL_REQUIRED');

    const approval = await adapter.getApprovalRequest(req.id);
    expect(approval).not.toBeNull();
    expect(approval?.action).toBe('CONFIRM_DARSHAN_AND_TRANSIT_BOOKING');
    expect(approval?.totalCostInr).toBeGreaterThan(0);
    expect(approval?.breakdown.length).toBeGreaterThan(0);

    // Submitting approval unlocks progression
    const approvalResponse = await adapter.submitApproval(req.id);
    expect(approvalResponse.decision).toBe('approved');

    const postApproveStatus = await adapter.getAgentStatus(req.id);
    expect(postApproveStatus.uiState).toBe('APPROVED');
  }, 15000);

  it('safely halts when human operator rejects proposed booking', async () => {
    const adapter = new ShadowPilgrimosAdapter();
    const req = await adapter.createPilgrimageRequest({
      originCity: 'New Delhi',
      destinationTemple: 'Varanasi (Kashi Vishwanath Jyotirlinga)',
      startDate: '2026-09-15',
      endDate: '2026-09-17',
      travelers: 2,
      budgetTier: 'standard',
      constraints: {},
    });

    const rejection = await adapter.submitRejection(req.id, 'Cost exceeded budget');
    expect(rejection.decision).toBe('rejected');
    expect(rejection.reason).toBe('Cost exceeded budget');

    const status = await adapter.getAgentStatus(req.id);
    expect(status.uiState).toBe('REJECTED');
    expect(status.logs.some((l) => l.message.includes('Zero financial or booking actions'))).toBe(true);
  });
});

describe('PilgrimOS API Client Switcher', () => {
  it('allows one-line switching between shadow and source adapters', () => {
    expect(apiClient.mode).toBe('shadow');
    expect(apiClient.adapter).toBeInstanceOf(ShadowPilgrimosAdapter);

    apiClient.setMode('source');
    expect(apiClient.mode).toBe('source');
    expect(apiClient.adapter).toBeInstanceOf(SourcePilgrimosAdapter);

    // Switch back to shadow default
    apiClient.setMode('shadow');
    expect(apiClient.mode).toBe('shadow');
  });
});

describe('PilgrimOS Critical UI Components & Safety Boundary', () => {
  it('renders stepper with HITL approval stage highlighted', () => {
    const html = renderStepper('APPROVAL_REQUIRED');
    expect(html).toContain('stepper-container');
    expect(html).toContain('4. HITL Approval');
    expect(html).toContain('approval-step');
  });

  it('renders prominent HITL approval boundary with non-negotiable warning copy', () => {
    const mockApproval: ApprovalRequest = {
      id: 'appr-test',
      requestId: 'req-test',
      action: 'CONFIRM_DARSHAN_AND_TRANSIT_BOOKING',
      summary: 'Booking for 2 pilgrims',
      route: 'New Delhi → Varanasi',
      travelDates: '2026-09-15 to 2026-09-17',
      travelersCount: 2,
      breakdown: [
        { item: 'Vande Bharat Express (2 seats)', costInr: 3700 },
        { item: 'Kashi Trust Suite (2 nights)', costInr: 6400 },
      ],
      totalCostInr: 10100,
      consequences: ['Issues confirmed passes'],
      requiredBy: 'Human Operator',
    };

    const html = renderHitlApproval(mockApproval);
    expect(html).toContain('hitl-approval-barrier');
    expect(html).toContain('ACTION REQUIRES YOUR EXPLICIT APPROVAL');
    expect(html).toContain('the agent will NOT continue until you explicitly approve');
    expect(html).toContain('btn-approve-approval');
    expect(html).toContain('btn-reject-approval');
    expect(html).toContain('₹10,100');
  });

  it('renders journey plan with crowd forecasts and alternative temples', () => {
    const mockPlan: JourneyPlan = {
      id: 'plan-test',
      requestId: 'req-test',
      title: 'Sacred Kashi Yatra',
      totalEstimatedCostInr: 8500,
      recommendedTransport: {
        id: 'tr-1',
        mode: 'train',
        provider: 'Vande Bharat Express',
        departureTime: '06:00 AM',
        arrivalTime: '02:00 PM',
        duration: '8h',
        priceInr: 3700,
        availableSeats: 20,
        serviceClass: 'CC',
      },
      recommendedAccommodation: {
        id: 'acc-1',
        name: 'Kashi Guest House',
        type: 'temple_trust',
        distanceFromTempleKm: 0.3,
        roomType: 'AC Room',
        pricePerNightInr: 3200,
        availableRooms: 5,
        amenities: ['Satvik Bhojan'],
        rating: 4.8,
      },
      crowdForecasts: [
        {
          date: '2026-09-15',
          crowdLevel: 'moderate',
          expectedWaitHours: 0.8,
          darshanSlotsRemaining: 40,
          vipDarshanAvailable: true,
        },
      ],
      nearbyAlternatives: [
        {
          id: 'alt-1',
          name: 'Kaal Bhairav Temple',
          distanceKm: 1.8,
          travelTime: '10 mins',
          keyDeity: 'Lord Kaal Bhairav',
          crowdLevel: 'moderate',
          reason: 'Traditional ritual necessity',
        },
      ],
      itinerary: [
        {
          day: 1,
          date: '2026-09-15',
          title: 'Arrival & Aarti',
          activities: [
            {
              time: '02:00 PM',
              title: 'Arrival',
              description: 'Varanasi Junction',
            },
          ],
        },
      ],
      notes: ['Valid ID card required'],
    };

    const html = renderJourneyPlan(mockPlan);
    expect(html).toContain('Sacred Kashi Yatra');
    expect(html).toContain('Vande Bharat Express');
    expect(html).toContain('Kashi Guest House');
    expect(html).toContain('Kaal Bhairav Temple');
    expect(html).toContain('Crowd Density Forecast');
  });
});
