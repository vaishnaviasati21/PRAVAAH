"use strict";
var PilgrimOS = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/frontend/main.ts
  var main_exports = {};
  __export(main_exports, {
    initApp: () => initApp
  });

  // src/frontend/state/store.ts
  var Store = class {
    state = {
      uiState: "IDLE",
      request: null,
      status: null,
      plan: null,
      availability: null,
      approval: null,
      approvalResponse: null,
      error: null,
      isPolling: false
    };
    listeners = /* @__PURE__ */ new Set();
    getState() {
      return { ...this.state };
    }
    setState(partial) {
      this.state = { ...this.state, ...partial };
      this.notify();
    }
    subscribe(listener) {
      this.listeners.add(listener);
      listener(this.getState());
      return () => {
        this.listeners.delete(listener);
      };
    }
    notify() {
      const current = this.getState();
      this.listeners.forEach((listener) => {
        try {
          listener(current);
        } catch (err) {
          console.error("Error in store listener:", err);
        }
      });
    }
    reset() {
      this.setState({
        uiState: "IDLE",
        request: null,
        status: null,
        plan: null,
        availability: null,
        approval: null,
        approvalResponse: null,
        error: null,
        isPolling: false
      });
    }
    setError(error) {
      this.setState({
        error,
        uiState: "FAILED",
        isPolling: false
      });
    }
    clearError() {
      this.setState({ error: null });
    }
  };
  var store = new Store();

  // src/frontend/api/adapter-shadow.ts
  var ShadowPilgrimosAdapter = class {
    modeName = "shadow";
    sessions = /* @__PURE__ */ new Map();
    timers = /* @__PURE__ */ new Map();
    async createPilgrimageRequest(input) {
      const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const request = {
        ...input,
        id,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const initialStatus = {
        requestId: id,
        stageName: "Understanding your pilgrimage requirements",
        uiState: "PLANNING",
        progressPercent: 10,
        message: `Analyzing route from ${input.originCity} to ${input.destinationTemple} for ${input.travelers} traveler(s)...`,
        logs: [
          {
            timestamp: this.formatTime(),
            level: "info",
            message: `Request received: ${input.originCity} \u2192 ${input.destinationTemple}`
          },
          {
            timestamp: this.formatTime(),
            level: "info",
            message: `Parsed constraints: Senior darshan=${Boolean(input.constraints.seniorCitizenDarshan)}, Wheelchair=${Boolean(input.constraints.wheelchairAccess)}`
          }
        ],
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const session = {
        request,
        status: initialStatus,
        plan: null,
        availability: null,
        approval: null,
        stepIndex: 0
      };
      this.sessions.set(id, session);
      this.scheduleExecutionStages(id);
      return request;
    }
    async getAgentStatus(requestId) {
      const session = this.sessions.get(requestId);
      if (!session) {
        throw new Error(`Session ${requestId} not found in shadow adapter`);
      }
      return { ...session.status };
    }
    async getJourneyPlan(requestId) {
      const session = this.sessions.get(requestId);
      return session?.plan ?? null;
    }
    async getAvailability(requestId) {
      const session = this.sessions.get(requestId);
      return session?.availability ?? null;
    }
    async getApprovalRequest(requestId) {
      const session = this.sessions.get(requestId);
      return session?.approval ?? null;
    }
    async submitApproval(requestId) {
      const session = this.sessions.get(requestId);
      if (!session) {
        throw new Error(`Session ${requestId} not found`);
      }
      session.status.uiState = "APPROVED";
      session.status.progressPercent = 95;
      session.status.stageName = "Human approval confirmed";
      session.status.message = "Approval verified. Dispatched autonomous transaction intent to booking queue.";
      session.status.logs.push({
        timestamp: this.formatTime(),
        level: "success",
        message: "Human approval intent received. Autonomous safety gate unlocked."
      });
      setTimeout(() => {
        session.status.uiState = "COMPLETED";
        session.status.progressPercent = 100;
        session.status.stageName = "Pilgrimage journey finalized & synchronized";
        session.status.message = "All bookings & darshan passes reserved. Safe and blessed journey!";
        session.status.logs.push({
          timestamp: this.formatTime(),
          level: "success",
          message: "PNR & Temple Entry Pass confirmed: TT-8849201-DARSHAN"
        });
      }, 1800);
      return {
        requestId,
        decision: "approved",
        processedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    async submitRejection(requestId, reason) {
      const session = this.sessions.get(requestId);
      if (!session) {
        throw new Error(`Session ${requestId} not found`);
      }
      session.status.uiState = "REJECTED";
      session.status.stageName = "Pilgrimage plan rejected by user";
      session.status.message = reason ? `Action cancelled by human: ${reason}` : "User rejected the booking action. Autonomous agent safely halted.";
      session.status.logs.push({
        timestamp: this.formatTime(),
        level: "warn",
        message: "Approval rejected by human operator. Zero financial or booking actions performed."
      });
      return {
        requestId,
        decision: "rejected",
        processedAt: (/* @__PURE__ */ new Date()).toISOString(),
        reason
      };
    }
    async cancelPilgrimage(requestId) {
      const timer = this.timers.get(requestId);
      if (timer) clearTimeout(timer);
      this.sessions.delete(requestId);
    }
    // --- Progressive Simulation Engine ---
    scheduleExecutionStages(requestId) {
      const stages = [
        {
          uiState: "RESEARCHING",
          delay: 1200,
          progress: 25,
          stageName: "Searching transport connections",
          message: "Querying high-speed trains, airlines, and inter-city EV cabs...",
          log: {
            level: "info",
            message: "Found 3 direct train routes and 2 flight schedules matching requested arrival window."
          }
        },
        {
          uiState: "RESEARCHING",
          delay: 2600,
          progress: 45,
          stageName: "Checking accommodation & Dharamshalas",
          message: "Scanning verified temple trust rest houses and nearby hotels...",
          log: {
            level: "info",
            message: "Retrieved availability for Trust Guest House (400m from main temple gate)."
          }
        },
        {
          uiState: "RESEARCHING",
          delay: 4200,
          progress: 65,
          stageName: "Checking darshan availability across official portals",
          message: "Scanning official temple trust quota & special entry time slots...",
          log: {
            level: "info",
            message: "Special Entry Darshan slots available: 07:00 AM and 04:30 PM."
          }
        },
        {
          uiState: "RESEARCHING",
          delay: 5800,
          progress: 80,
          stageName: "Forecasting crowd levels & historical footfall",
          message: "Running ML footfall models on tithi, festivals, and weekend rush...",
          log: {
            level: "info",
            message: "Crowd model: Low to Moderate on Day 1, Expected Darshan queue: ~45 mins."
          }
        },
        {
          uiState: "RESULTS_READY",
          delay: 7400,
          progress: 90,
          stageName: "Itinerary compiled & optimized",
          message: "Comprehensive journey plan ready. Preparing booking package for human verification.",
          log: {
            level: "success",
            message: "Complete pilgrimage plan assembled. Enforcing Human-in-the-Loop approval barrier."
          },
          action: (session) => {
            this.populateData(session);
          }
        },
        {
          uiState: "APPROVAL_REQUIRED",
          delay: 9200,
          progress: 92,
          stageName: "Action requires explicit human approval",
          message: "Agent has prepared ticket & slot reservations. The agent will NOT proceed without your approval.",
          log: {
            level: "warn",
            message: "SAFETY GATE LOCKED: Awaiting explicit Approve/Reject decision."
          },
          action: (session) => {
            this.populateApproval(session);
          }
        }
      ];
      stages.forEach((stage) => {
        const timer = setTimeout(() => {
          const session = this.sessions.get(requestId);
          if (!session) return;
          session.status.uiState = stage.uiState;
          session.status.progressPercent = stage.progress;
          session.status.stageName = stage.stageName;
          session.status.message = stage.message;
          session.status.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
          session.status.logs.push({
            timestamp: this.formatTime(),
            level: stage.log.level,
            message: stage.log.message
          });
          if (stage.action) {
            stage.action(session);
          }
        }, stage.delay);
        this.timers.set(requestId, timer);
      });
    }
    populateData(session) {
      const req = session.request;
      const isVaranasi = req.destinationTemple.toLowerCase().includes("varanasi") || req.destinationTemple.toLowerCase().includes("kashi");
      const isTirupati = req.destinationTemple.toLowerCase().includes("tirupati") || req.destinationTemple.toLowerCase().includes("venkateswara");
      if (isTirupati) {
        this.populateTirupati(session);
      } else {
        this.populateVaranasi(session);
      }
    }
    populateVaranasi(session) {
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
        title: `Kashi Vishwanath Sacred Yatra (${req.originCity} \u2192 Varanasi)`,
        totalEstimatedCostInr: totalCost,
        recommendedTransport: {
          id: "tr-01",
          mode: "train",
          provider: "Vande Bharat Express (22436)",
          departureTime: "06:00 AM (New Delhi)",
          arrivalTime: "02:00 PM (Varanasi Jn)",
          duration: "8h 00m",
          priceInr: transportCost,
          availableSeats: 34,
          serviceClass: "AC Chair Car (CC)"
        },
        recommendedAccommodation: {
          id: "acc-01",
          name: "Kashi Vishwanath Corridor Guest House",
          type: "temple_trust",
          distanceFromTempleKm: 0.3,
          roomType: "Deluxe AC Room (Temple View)",
          pricePerNightInr: stayCost,
          availableRooms: 6,
          amenities: ["Satvik Bhojanalaya", "Wheelchair Access", "24/7 Hot Water", "Luggage Cloakroom"],
          rating: 4.8
        },
        crowdForecasts: [
          {
            date: req.startDate || "2026-09-15",
            crowdLevel: "moderate",
            expectedWaitHours: 0.8,
            darshanSlotsRemaining: 42,
            vipDarshanAvailable: true
          },
          {
            date: req.endDate || "2026-09-16",
            crowdLevel: "low",
            expectedWaitHours: 0.4,
            darshanSlotsRemaining: 88,
            vipDarshanAvailable: true
          }
        ],
        nearbyAlternatives: [
          {
            id: "alt-01",
            name: "Kaal Bhairav Temple (Kotwal of Kashi)",
            distanceKm: 1.8,
            travelTime: "10 mins by e-rickshaw",
            keyDeity: "Lord Kaal Bhairav",
            crowdLevel: "moderate",
            reason: "Traditional ritual necessity to visit before or after Vishwanath darshan."
          },
          {
            id: "alt-02",
            name: "Sarnath Deer Park & Dhamek Stupa",
            distanceKm: 10.2,
            travelTime: "25 mins by cab",
            keyDeity: "Lord Buddha / Ancient Stupa",
            crowdLevel: "low",
            reason: "Serene spiritual sanctuary with zero rush; excellent peaceful retreat."
          },
          {
            id: "alt-03",
            name: "Sankat Mochan Hanuman Mandir",
            distanceKm: 3.5,
            travelTime: "15 mins",
            keyDeity: "Lord Hanuman (Tulsidas Consecrated)",
            crowdLevel: "moderate",
            reason: "Renowned for divine prasadam and peaceful evening sankirtan."
          }
        ],
        itinerary: [
          {
            day: 1,
            date: req.startDate || "2026-09-15",
            title: "Arrival, Ghat Sanctification & Ganga Aarti",
            activities: [
              {
                time: "02:00 PM",
                title: "Arrival at Varanasi Cantt (BSB)",
                description: "Pre-arranged pre-paid cab transit directly to Godowlia Crossing.",
                location: "Varanasi Junction"
              },
              {
                time: "03:30 PM",
                title: "Check-in & Rest",
                description: "Settle into Kashi Vishwanath Corridor Guest House with Satvik lunch.",
                location: "Kashi Corridor"
              },
              {
                time: "05:30 PM",
                title: "Private Boat to Dashashwamedh Ghat",
                description: "Reserved bajra boat for panoramic view of the world-famous evening Maha Aarti.",
                location: "Dashashwamedh Ghat"
              }
            ]
          },
          {
            day: 2,
            date: req.endDate || "2026-09-16",
            title: "Mangala Darshan, Corridor Parikrama & Sacred Return",
            activities: [
              {
                time: "06:30 AM",
                title: "Sugam Special Entry Darshan",
                description: "Direct priority corridor access via Gate 4 (dedicated senior/priority queue).",
                location: "Kashi Vishwanath Sanctum",
                isDarshan: true
              },
              {
                time: "09:00 AM",
                title: "Annapurna Mandir & Vishalakshi Shaktipeeth",
                description: "Walking parikrama inside the historic lanes adjoining the corridor.",
                location: "Temple Precincts"
              },
              {
                time: "01:30 PM",
                title: "Return Journey Departure",
                description: "Transfer to Varanasi Cantt for return Vande Bharat Express.",
                location: "Varanasi Junction"
              }
            ]
          }
        ],
        notes: [
          "Electronic gadgets and leather items are strictly prohibited inside the sanctum sanctorum.",
          "Dedicated senior citizen battery carts available between Godowlia and Gate 4.",
          "Carry physical government ID cards (Aadhaar/Passport) matching darshan pass names."
        ]
      };
      session.availability = {
        requestId: session.request.id,
        transports: [
          session.plan.recommendedTransport,
          {
            id: "tr-02",
            mode: "flight",
            provider: "IndiGo (6E-2041)",
            departureTime: "09:15 AM (DEL T2)",
            arrivalTime: "10:45 AM (VNS)",
            duration: "1h 30m",
            priceInr: 3950 * travelers,
            availableSeats: 12,
            serviceClass: "Economy"
          }
        ],
        accommodations: [
          session.plan.recommendedAccommodation,
          {
            id: "acc-02",
            name: "BrijRama Palace Heritage",
            type: "hotel",
            distanceFromTempleKm: 0.6,
            roomType: "Heritage Suite",
            pricePerNightInr: 12500,
            availableRooms: 2,
            amenities: ["Private Ghat Boat", "Heritage Architecture", "Pure Vegetarian Cuisine"],
            rating: 4.9
          }
        ],
        crowdForecasts: session.plan.crowdForecasts,
        darshanSlots: [
          {
            temple: "Kashi Vishwanath Jyotirlinga",
            date: req.startDate || "2026-09-15",
            slots: [
              { slotTime: "06:30 AM - 07:30 AM", availableCount: 18, quotaType: "Sugam Darshan" },
              { slotTime: "11:00 AM - 12:00 PM", availableCount: 5, quotaType: "General Slot" },
              { slotTime: "04:30 PM - 05:30 PM", availableCount: 26, quotaType: "Sugam Darshan" }
            ]
          }
        ]
      };
    }
    populateTirupati(session) {
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
        title: `Tirumala Balaji Special Entry Darshan (${req.originCity} \u2192 Tirupati)`,
        totalEstimatedCostInr: totalCost,
        recommendedTransport: {
          id: "tr-ttd-01",
          mode: "train",
          provider: "Vande Bharat Express (20677)",
          departureTime: "05:30 AM (Bengaluru Cantt)",
          arrivalTime: "08:45 AM (Tirupati Main)",
          duration: "3h 15m",
          priceInr: transportCost,
          availableSeats: 48,
          serviceClass: "AC Chair Car"
        },
        recommendedAccommodation: {
          id: "acc-ttd-01",
          name: "TTD Srinivasam Complex Rest House",
          type: "temple_trust",
          distanceFromTempleKm: 0.2,
          roomType: "AC Suite (Shrine Board)",
          pricePerNightInr: stayCost,
          availableRooms: 14,
          amenities: ["Direct Ghat Road Shuttle", "Laddu Prasadam Counter", "24/7 Temple Helpdesk"],
          rating: 4.7
        },
        crowdForecasts: [
          {
            date: req.startDate || "2026-09-18",
            crowdLevel: "moderate",
            expectedWaitHours: 2.5,
            darshanSlotsRemaining: 65,
            vipDarshanAvailable: true
          },
          {
            date: req.endDate || "2026-09-19",
            crowdLevel: "high",
            expectedWaitHours: 4,
            darshanSlotsRemaining: 15,
            vipDarshanAvailable: false
          }
        ],
        nearbyAlternatives: [
          {
            id: "alt-ttd-01",
            name: "Sri Kalahasti Rahu-Ketu Kshetram",
            distanceKm: 36,
            travelTime: "45 mins by direct cab",
            keyDeity: "Lord Shiva (Vayu Lingam)",
            crowdLevel: "low",
            reason: "Vayu Linga darshan with swift line (under 30 mins) if Tirumala queues peak."
          },
          {
            id: "alt-ttd-02",
            name: "Kanipakam Sri Varasiddhi Vinayaka Temple",
            distanceKm: 68,
            travelTime: "1h 15m",
            keyDeity: "Self-manifested Lord Ganesha",
            crowdLevel: "moderate",
            reason: "Historic well temple; excellent morning visit before afternoon Tirumala darshan."
          }
        ],
        itinerary: [
          {
            day: 1,
            date: req.startDate || "2026-09-18",
            title: "Arrival & Scenic Ghat Ascent to Tirumala",
            activities: [
              {
                time: "08:45 AM",
                title: "Arrival at Tirupati Railway Station",
                description: "Reception and boarding dedicated electric ghat road transit.",
                location: "Tirupati Station"
              },
              {
                time: "10:30 AM",
                title: "Tirumala Hill Check-in",
                description: "Check-in to TTD Srinivasam Suite, tonsure ritual (Kalyanakatta) assistance.",
                location: "Tirumala Hills"
              },
              {
                time: "02:00 PM",
                title: "Special Entry Darshan (\u20B9300 Seva Q)",
                description: "Entry via Vaikuntam Queue Complex 2 with verified digital barcode pass.",
                location: "Ananda Nilayam Sanctum",
                isDarshan: true
              }
            ]
          }
        ],
        notes: [
          "Strict traditional dress code: Dhoti/Kurta for men, Saree/Chudidar for women.",
          "Aadhaar verification is mandatory at Vaikuntam entrance."
        ]
      };
      session.availability = {
        requestId: session.request.id,
        transports: [session.plan.recommendedTransport],
        accommodations: [session.plan.recommendedAccommodation],
        crowdForecasts: session.plan.crowdForecasts,
        darshanSlots: [
          {
            temple: "Sri Venkateswara Temple, Tirumala",
            date: req.startDate || "2026-09-18",
            slots: [
              { slotTime: "02:00 PM - 03:00 PM", availableCount: 45, quotaType: "Special Entry Darshan (\u20B9300)" },
              { slotTime: "05:00 PM - 06:00 PM", availableCount: 20, quotaType: "Special Entry Darshan (\u20B9300)" }
            ]
          }
        ]
      };
    }
    populateApproval(session) {
      if (!session.plan) return;
      const req = session.request;
      const travelers = req.travelers || 2;
      const plan = session.plan;
      session.approval = {
        id: `appr_${session.request.id}`,
        requestId: session.request.id,
        action: "CONFIRM_DARSHAN_AND_TRANSIT_BOOKING",
        summary: `Autonomous agent prepared booking reservation for ${travelers} pilgrim(s) to ${req.destinationTemple}`,
        route: `${req.originCity} \u2192 ${req.destinationTemple}`,
        travelDates: `${req.startDate} to ${req.endDate}`,
        travelersCount: travelers,
        breakdown: [
          { item: `${plan.recommendedTransport.provider} (${travelers} seats)`, costInr: plan.recommendedTransport.priceInr },
          { item: `${plan.recommendedAccommodation.name} (1 night)`, costInr: plan.recommendedAccommodation.pricePerNightInr },
          { item: `Official Temple Trust Darshan Entry Passes (${travelers}x)`, costInr: 500 * travelers },
          { item: "Local e-transit & pilgrimage insurance", costInr: 1200 }
        ],
        totalCostInr: plan.totalEstimatedCostInr,
        consequences: [
          "Reserves official temple trust entry slots in the names of the travelers.",
          "Issues rail/transit booking confirmations.",
          "Generates unified PilgrimOS offline pass with emergency helpline numbers."
        ],
        requiredBy: "Human Operator (Safe Agent Execution Boundary)"
      };
    }
    formatTime() {
      const now = /* @__PURE__ */ new Date();
      return now.toTimeString().split(" ")[0] ?? "12:00:00";
    }
  };

  // src/frontend/api/adapter-source.ts
  var SourcePilgrimosAdapter = class {
    modeName = "source";
    baseUrl;
    fetchImpl;
    constructor(options = {}) {
      this.baseUrl = (options.apiBaseUrl ?? "http://localhost:3000/api/pilgrimos").replace(/\/+$/, "");
      if (options.fetchImpl) {
        this.fetchImpl = options.fetchImpl;
      } else if (typeof window !== "undefined" && typeof window.fetch === "function") {
        this.fetchImpl = window.fetch.bind(window);
      } else if (typeof fetch === "function") {
        this.fetchImpl = fetch;
      } else {
        this.fetchImpl = (() => {
          throw new Error("No fetch implementation available in current runtime environment.");
        });
      }
    }
    async createPilgrimageRequest(input) {
      const data = await this.postJson("/requests", input);
      return data.request;
    }
    async getAgentStatus(requestId) {
      const data = await this.getJson(
        `/requests/${encodeURIComponent(requestId)}/status`
      );
      return data.status;
    }
    async getJourneyPlan(requestId) {
      const data = await this.getJson(
        `/requests/${encodeURIComponent(requestId)}/plan`
      );
      return data.plan;
    }
    async getAvailability(requestId) {
      const data = await this.getJson(
        `/requests/${encodeURIComponent(requestId)}/availability`
      );
      return data.availability;
    }
    async getApprovalRequest(requestId) {
      const data = await this.getJson(
        `/requests/${encodeURIComponent(requestId)}/approval`
      );
      return data.approval;
    }
    async submitApproval(requestId) {
      const data = await this.postJson(
        `/requests/${encodeURIComponent(requestId)}/approval/approve`,
        {}
      );
      return data.response;
    }
    async submitRejection(requestId, reason) {
      const data = await this.postJson(
        `/requests/${encodeURIComponent(requestId)}/approval/reject`,
        { reason }
      );
      return data.response;
    }
    async cancelPilgrimage(requestId) {
      await this.postJson(`/requests/${encodeURIComponent(requestId)}/cancel`, {});
    }
    // --- Network Helpers ---
    async getJson(path) {
      try {
        const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
          method: "GET",
          headers: { Accept: "application/json" }
        });
        if (!response.ok) {
          throw new Error(`Backend returned HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (err) {
        throw new Error(
          `Failed to reach backend at ${this.baseUrl}${path}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
    async postJson(path, body) {
      try {
        const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify(body)
        });
        if (!response.ok) {
          throw new Error(`Backend returned HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (err) {
        throw new Error(
          `Failed to reach backend at ${this.baseUrl}${path}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  };

  // src/frontend/api/client.ts
  var ApiClientManager = class {
    currentMode = "shadow";
    shadowAdapter = new ShadowPilgrimosAdapter();
    sourceAdapter = new SourcePilgrimosAdapter();
    get adapter() {
      return this.currentMode === "shadow" ? this.shadowAdapter : this.sourceAdapter;
    }
    get mode() {
      return this.currentMode;
    }
    setMode(mode) {
      this.currentMode = mode;
    }
  };
  var apiClient = new ApiClientManager();

  // src/frontend/components/Stepper.ts
  function renderStepper(uiState) {
    const steps = [
      {
        key: "request",
        label: "1. Request",
        num: "1",
        isActive: uiState === "IDLE" || uiState === "PLANNING",
        isCompleted: !["IDLE", "PLANNING"].includes(uiState)
      },
      {
        key: "research",
        label: "2. Agent Research",
        num: "2",
        isActive: uiState === "RESEARCHING",
        isCompleted: ["RESULTS_READY", "APPROVAL_REQUIRED", "APPROVED", "REJECTED", "COMPLETED"].includes(uiState)
      },
      {
        key: "results",
        label: "3. Journey & Slots",
        num: "3",
        isActive: uiState === "RESULTS_READY",
        isCompleted: ["APPROVAL_REQUIRED", "APPROVED", "REJECTED", "COMPLETED"].includes(uiState)
      },
      {
        key: "approval",
        label: "4. HITL Approval",
        num: "!",
        isApproval: true,
        isActive: uiState === "APPROVAL_REQUIRED",
        isCompleted: ["APPROVED", "COMPLETED"].includes(uiState)
      },
      {
        key: "completion",
        label: "5. Synchronized",
        num: "\u2713",
        isActive: uiState === "APPROVED" || uiState === "COMPLETED",
        isCompleted: uiState === "COMPLETED"
      }
    ];
    return `
    <div class="stepper-container fade-in">
      <div class="stepper-track">
        ${steps.map((step) => {
      const classList = [
        "stepper-step",
        step.isActive ? "active" : "",
        step.isCompleted ? "completed" : "",
        step.isApproval ? "approval-step" : ""
      ].filter(Boolean).join(" ");
      return `
              <div class="${classList}">
                <div class="step-node">${step.isCompleted ? "\u2713" : step.num}</div>
                <div class="step-label">${step.label}</div>
              </div>
            `;
    }).join("")}
      </div>
    </div>
  `;
  }

  // src/frontend/components/RequestForm.ts
  function validateForm(data) {
    const errors = {};
    if (!data.originCity || data.originCity.trim().length < 2) {
      errors.originCity = "Please enter a valid starting city or airport/rail hub.";
    }
    if (!data.destinationTemple || data.destinationTemple.trim().length < 3) {
      errors.destinationTemple = "Please choose a pilgrimage temple destination.";
    }
    if (!data.startDate) {
      errors.startDate = "Please select your pilgrimage start date.";
    }
    if (!data.endDate) {
      errors.endDate = "Please select your return date.";
    } else if (data.startDate && data.endDate < data.startDate) {
      errors.endDate = "Return date cannot be earlier than start date.";
    }
    if (!data.travelers || data.travelers < 1) {
      errors.travelers = "Must have at least 1 pilgrim.";
    } else if (data.travelers > 20) {
      errors.travelers = "For groups over 20, contact Temple Trust Group Desk.";
    }
    return errors;
  }
  function renderRequestForm(initialData, errors = {}, isSubmitting2 = false) {
    const origin = initialData?.originCity ?? "New Delhi";
    const destination = initialData?.destinationTemple ?? "Varanasi (Kashi Vishwanath Jyotirlinga)";
    const startDate = initialData?.startDate ?? "2026-09-15";
    const endDate = initialData?.endDate ?? "2026-09-17";
    const travelers = initialData?.travelers ?? 2;
    const budget = initialData?.budgetTier ?? "standard";
    const senior = initialData?.constraints?.seniorCitizenDarshan ?? true;
    const wheelchair = initialData?.constraints?.wheelchairAccess ?? false;
    const satvik = initialData?.constraints?.fastingOrSatvikFood ?? true;
    const alternatives = initialData?.constraints?.nearbyAlternativeTemplesOk ?? true;
    return `
    <div class="glass-panel fade-in">
      <div class="panel-header">
        <h1 class="panel-header-title">
          <span>\u2728</span> Plan Your Autonomous Pilgrimage
        </h1>
        <p class="panel-header-subtitle">
          PilgrimOS orchestrates official darshan slots, verified transport, sacred stays, and footfall predictions in one plan.
        </p>
      </div>

      <!-- Rapid Demo Presets -->
      <div class="presets-bar">
        <span style="font-size: 0.78rem; font-weight: 700; color: var(--saffron-500);">\u26A1 DEMO PRESETS:</span>
        <button type="button" class="preset-chip" data-preset="varanasi">Delhi \u2192 Varanasi (Kashi)</button>
        <button type="button" class="preset-chip" data-preset="tirupati">Bengaluru \u2192 Tirupati Balaji</button>
        <button type="button" class="preset-chip" data-preset="vaishnodevi">Delhi \u2192 Vaishno Devi</button>
        <button type="button" class="preset-chip" data-preset="shirdi">Mumbai \u2192 Shirdi Sai Baba</button>
      </div>

      <form id="pilgrimage-request-form" novalidate>
        <div class="form-grid">
          <!-- Origin City -->
          <div class="form-group">
            <label class="form-label" for="originCity">
              Starting Location
              <span style="color: var(--saffron-500);">*</span>
            </label>
            <input
              type="text"
              id="originCity"
              name="originCity"
              class="form-input ${errors.originCity ? "error" : ""}"
              placeholder="e.g. New Delhi, Bengaluru, Mumbai"
              value="${origin}"
              required
            />
            ${errors.originCity ? `<div class="form-error">${errors.originCity}</div>` : ""}
          </div>

          <!-- Destination Temple -->
          <div class="form-group">
            <label class="form-label" for="destinationTemple">
              Sacred Destination
              <span style="color: var(--saffron-500);">*</span>
            </label>
            <select
              id="destinationTemple"
              name="destinationTemple"
              class="form-select ${errors.destinationTemple ? "error" : ""}"
              required
            >
              <option value="Varanasi (Kashi Vishwanath Jyotirlinga)" ${destination.includes("Varanasi") ? "selected" : ""}>
                Varanasi (Kashi Vishwanath Jyotirlinga, UP)
              </option>
              <option value="Tirupati (Sri Venkateswara Swami, Tirumala)" ${destination.includes("Tirupati") ? "selected" : ""}>
                Tirupati (Sri Venkateswara Swami, AP)
              </option>
              <option value="Vaishno Devi (Mata Vaishno Devi Shrine, Katra)" ${destination.includes("Vaishno") ? "selected" : ""}>
                Vaishno Devi (Mata Vaishno Devi Shrine, J&K)
              </option>
              <option value="Shirdi (Sai Baba Sansthan)" ${destination.includes("Shirdi") ? "selected" : ""}>
                Shirdi (Sai Baba Sansthan, Maharashtra)
              </option>
              <option value="Sabarimala (Lord Ayyappa Temple)" ${destination.includes("Sabarimala") ? "selected" : ""}>
                Sabarimala (Lord Ayyappa Temple, Kerala)
              </option>
            </select>
            ${errors.destinationTemple ? `<div class="form-error">${errors.destinationTemple}</div>` : ""}
          </div>

          <!-- Start Date -->
          <div class="form-group">
            <label class="form-label" for="startDate">
              Start Date
              <span style="color: var(--saffron-500);">*</span>
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              class="form-input ${errors.startDate ? "error" : ""}"
              value="${startDate}"
              required
            />
            ${errors.startDate ? `<div class="form-error">${errors.startDate}</div>` : ""}
          </div>

          <!-- End Date -->
          <div class="form-group">
            <label class="form-label" for="endDate">
              Return Date
              <span style="color: var(--saffron-500);">*</span>
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              class="form-input ${errors.endDate ? "error" : ""}"
              value="${endDate}"
              required
            />
            ${errors.endDate ? `<div class="form-error">${errors.endDate}</div>` : ""}
          </div>

          <!-- Number of Travelers -->
          <div class="form-group">
            <label class="form-label" for="travelers">
              Number of Pilgrims
              <span style="color: var(--saffron-500);">*</span>
            </label>
            <input
              type="number"
              id="travelers"
              name="travelers"
              min="1"
              max="20"
              class="form-input ${errors.travelers ? "error" : ""}"
              value="${travelers}"
              required
            />
            ${errors.travelers ? `<div class="form-error">${errors.travelers}</div>` : ""}
          </div>

          <!-- Budget Tier -->
          <div class="form-group">
            <label class="form-label" for="budgetTier">Budget Preference</label>
            <select id="budgetTier" name="budgetTier" class="form-select">
              <option value="budget" ${budget === "budget" ? "selected" : ""}>Economy / Dharamshala</option>
              <option value="standard" ${budget === "standard" ? "selected" : ""}>Standard / Temple Trust Suite</option>
              <option value="premium" ${budget === "premium" ? "selected" : ""}>Premium / Direct Corridor VIP</option>
            </select>
          </div>

          <!-- Special Constraints & Preferences -->
          <div class="form-group full-width" style="margin-top: 0.5rem;">
            <label class="form-label">Ritual Preferences & Special Assistance</label>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem; margin-top: 0.35rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer; color: var(--text-secondary);">
                <input type="checkbox" id="seniorCitizenDarshan" name="seniorCitizenDarshan" ${senior ? "checked" : ""} />
                Senior Citizen Priority Darshan
              </label>

              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer; color: var(--text-secondary);">
                <input type="checkbox" id="wheelchairAccess" name="wheelchairAccess" ${wheelchair ? "checked" : ""} />
                Wheelchair / Ramp Access
              </label>

              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer; color: var(--text-secondary);">
                <input type="checkbox" id="fastingOrSatvikFood" name="fastingOrSatvikFood" ${satvik ? "checked" : ""} />
                Satvik / Pure Vegetarian Meals
              </label>

              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer; color: var(--text-secondary);">
                <input type="checkbox" id="nearbyAlternativeTemplesOk" name="nearbyAlternativeTemplesOk" ${alternatives ? "checked" : ""} />
                Recommend Nearby Shaktipeeths/Temples
              </label>
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-subtle);">
          <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--text-muted);">
            <span>\u{1F6E1}\uFE0F</span>
            <span>Zero payment or booking is made without explicit approval on the next screen.</span>
          </div>
          <button type="submit" class="btn btn-primary" id="btn-start-planning" ${isSubmitting2 ? "disabled" : ""}>
            ${isSubmitting2 ? "Initializing Agent..." : "Launch Autonomous Agent \u2794"}
          </button>
        </div>
      </form>
    </div>
  `;
  }

  // src/frontend/components/LiveStatus.ts
  function renderLiveStatus(status) {
    const stages = [
      { key: "requirements", label: "Understanding requirements & constraints", threshold: 10 },
      { key: "transport", label: "Searching transport (High-speed Rail / Flights)", threshold: 30 },
      { key: "stay", label: "Scanning accommodation & Temple Trust Dharamshalas", threshold: 50 },
      { key: "darshan", label: "Checking official Darshan slot availability & quotas", threshold: 70 },
      { key: "crowd", label: "Forecasting crowd footfall & queue wait times", threshold: 85 },
      { key: "itinerary", label: "Synthesizing journey plan & nearby alternatives", threshold: 90 }
    ];
    return `
    <div class="glass-panel fade-in live-status-container">
      <div class="panel-header">
        <h2 class="panel-header-title">
          <span>\u26A1</span> Autonomous Agent Active
        </h2>
        <p class="panel-header-subtitle">
          PilgrimOS is scanning multi-modal portals, historical footfall datasets, and temple trust servers.
        </p>
      </div>

      <!-- Agent Radar Status Banner -->
      <div class="agent-radar-banner">
        <div class="radar-content">
          <div class="radar-spinner"></div>
          <div>
            <div class="radar-status-title">${escapeHtml(status.stageName)}</div>
            <div class="radar-status-desc">${escapeHtml(status.message)}</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-display); color: var(--saffron-500);">
            ${status.progressPercent}%
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">
            Pipeline Progress
          </div>
        </div>
      </div>

      <!-- Progressive Stages Checklist -->
      <div class="agent-checklist">
        ${stages.map((stage) => {
      const isCompleted = status.progressPercent > stage.threshold;
      const isInProgress = status.progressPercent >= stage.threshold - 15 && status.progressPercent <= stage.threshold;
      let statusClass = "pending";
      let icon = "\u25CB";
      if (isCompleted) {
        statusClass = "completed";
        icon = "\u2713";
      } else if (isInProgress) {
        statusClass = "in-progress";
        icon = "\u25CF";
      }
      return `
              <div class="check-item ${statusClass}">
                <div class="check-title-group">
                  <div class="check-icon">${icon}</div>
                  <span style="font-size: 0.9rem; font-weight: 500;">${stage.label}</span>
                </div>
                <div style="font-size: 0.78rem; font-weight: 600; text-transform: uppercase; color: ${isCompleted ? "var(--emerald-400)" : isInProgress ? "var(--saffron-500)" : "var(--text-muted)"};">
                  ${isCompleted ? "Verified" : isInProgress ? "Scanning..." : "Pending"}
                </div>
              </div>
            `;
    }).join("")}
      </div>

      <!-- Autonomous Agent Console Output -->
      <div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">
            Autonomous Agent Stream Logs
          </span>
          <span style="font-size: 0.72rem; color: var(--emerald-400); display: flex; align-items: center; gap: 0.3rem;">
            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--emerald-400);"></span>
            Live Telemetry
          </span>
        </div>
        <div class="terminal-console" id="agent-console">
          ${status.logs.map(
      (log) => `
              <div class="terminal-line">
                <span class="terminal-time">[${escapeHtml(log.timestamp)}]</span>
                <span class="terminal-text ${log.level}">\u2794 ${escapeHtml(log.message)}</span>
              </div>
            `
    ).join("")}
        </div>
      </div>
    </div>
  `;
  }
  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  // src/frontend/components/JourneyPlanView.ts
  function renderJourneyPlan(plan, availability) {
    return `
    <div class="glass-panel fade-in" style="margin-bottom: 2rem;">
      <div class="panel-header">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 700; color: var(--saffron-500); text-transform: uppercase; margin-bottom: 0.25rem;">
              <span>\u{1F6A9}</span> Verified Autonomous Itinerary
            </div>
            <h2 class="panel-header-title">${escapeHtml2(plan.title)}</h2>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Estimated Total Cost</div>
            <div style="font-size: 1.8rem; font-weight: 800; font-family: var(--font-display); color: var(--gold-500);">
              \u20B9${plan.totalEstimatedCostInr.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      <!-- Hero Metrics Bar -->
      <div class="journey-summary-hero">
        <div class="metric-card">
          <span class="metric-title">Primary Transport</span>
          <span class="metric-value" style="font-size: 1.05rem;">${escapeHtml2(plan.recommendedTransport.provider)}</span>
          <span style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml2(plan.recommendedTransport.departureTime)}</span>
        </div>
        <div class="metric-card">
          <span class="metric-title">Temple Accommodation</span>
          <span class="metric-value" style="font-size: 1.05rem;">${escapeHtml2(plan.recommendedAccommodation.name)}</span>
          <span style="font-size: 0.78rem; color: var(--emerald-400);">
            \u2B50 ${plan.recommendedAccommodation.rating} (${plan.recommendedAccommodation.distanceFromTempleKm} km to Sanctum)
          </span>
        </div>
        <div class="metric-card">
          <span class="metric-title">Peak Queue Expectation</span>
          <span class="metric-value highlight" style="font-size: 1.05rem;">
            ~${plan.crowdForecasts[0]?.expectedWaitHours ?? 1} Hours Wait
          </span>
          <span style="font-size: 0.78rem; color: var(--text-muted);">
            Crowd Level: ${plan.crowdForecasts[0]?.crowdLevel.toUpperCase() ?? "MODERATE"}
          </span>
        </div>
      </div>

      <!-- Day-by-Day Sacred Itinerary -->
      <h3 style="font-size: 1.15rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
        <span>\u{1F5D3}\uFE0F</span> Day-by-Day Spiritual Schedule
      </h3>
      <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
        ${plan.itinerary.map(
      (day) => `
            <div class="itinerary-day-card">
              <div class="day-header">
                <span class="day-tag">Day ${day.day} \u2022 ${escapeHtml2(day.date)}</span>
                <span style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">${escapeHtml2(day.title)}</span>
              </div>
              <div class="day-events-list">
                ${day.activities.map(
        (act) => `
                    <div class="event-row">
                      <div class="event-time">${escapeHtml2(act.time)}</div>
                      <div class="event-details">
                        <div class="event-title">
                          ${act.isDarshan ? '<span style="color: var(--gold-500); margin-right: 0.3rem;">\u269C\uFE0F [DARSHAN]</span>' : ""}
                          ${escapeHtml2(act.title)}
                        </div>
                        <div class="event-desc">${escapeHtml2(act.description)}</div>
                      </div>
                    </div>
                  `
      ).join("")}
              </div>
            </div>
          `
    ).join("")}
      </div>

      <!-- Live Availability & Crowd Forecast -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        <!-- Crowd Density by Date -->
        <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: var(--radius-lg); border: 1px solid var(--border-subtle);">
          <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>\u{1F465}</span> Crowd Density Forecast
          </h4>
          <div style="display: flex; flex-direction: column; gap: 0.6rem;">
            ${plan.crowdForecasts.map(
      (cf) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm);">
                  <div>
                    <div style="font-size: 0.82rem; font-weight: 600;">${escapeHtml2(cf.date)}</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">Darshan Slots Remaining: ${cf.darshanSlotsRemaining}</div>
                  </div>
                  <div class="crowd-day crowd-${cf.crowdLevel === "low" ? "low" : cf.crowdLevel === "moderate" ? "moderate" : "high"}" style="flex: 0 0 90px;">
                    ${cf.crowdLevel.toUpperCase()}
                  </div>
                </div>
              `
    ).join("")}
          </div>
        </div>

        <!-- Official Darshan Slots -->
        <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: var(--radius-lg); border: 1px solid var(--border-subtle);">
          <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>\u{1F39F}\uFE0F</span> Available Darshan Passes
          </h4>
          <div style="display: flex; flex-direction: column; gap: 0.6rem;">
            ${(availability?.darshanSlots[0]?.slots ?? [
      { slotTime: "06:30 AM - 07:30 AM", quotaType: "Special Entry Pass", availableCount: 18 },
      { slotTime: "04:30 PM - 05:30 PM", quotaType: "Sugam Darshan", availableCount: 26 }
    ]).map(
      (slot) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm);">
                  <div>
                    <div style="font-size: 0.82rem; font-weight: 600; color: var(--saffron-500);">${escapeHtml2(slot.slotTime)}</div>
                    <div style="font-size: 0.72rem; color: var(--text-secondary);">${escapeHtml2(slot.quotaType)}</div>
                  </div>
                  <div style="font-size: 0.78rem; font-weight: 700; color: var(--emerald-400);">
                    ${slot.availableCount} Seats
                  </div>
                </div>
              `
    ).join("")}
          </div>
        </div>
      </div>

      <!-- Nearby Alternative Temples -->
      ${plan.nearbyAlternatives && plan.nearbyAlternatives.length > 0 ? `
        <div style="margin-bottom: 2rem;">
          <h3 style="font-size: 1.15rem; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>\u{1F6D5}</span> Recommended Nearby Alternative Temples & Parikrama
          </h3>
          <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 1rem;">
            Suggested if primary sanctum queue spikes or to complete traditional regional parikrama.
          </p>
          <div class="availability-grid">
            ${plan.nearbyAlternatives.map(
      (alt) => `
                <div class="option-card">
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                      <h4 style="font-size: 0.95rem; font-weight: 700;">${escapeHtml2(alt.name)}</h4>
                      <span style="font-size: 0.7rem; padding: 0.2rem 0.5rem; background: rgba(16, 185, 129, 0.15); color: var(--emerald-400); border-radius: var(--radius-full);">
                        ${escapeHtml2(alt.travelTime)}
                      </span>
                    </div>
                    <div style="font-size: 0.78rem; color: var(--saffron-500); margin-bottom: 0.4rem;">
                      Deity: ${escapeHtml2(alt.keyDeity)}
                    </div>
                    <p style="font-size: 0.8rem; color: var(--text-secondary);">
                      ${escapeHtml2(alt.reason)}
                    </p>
                  </div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); border-top: 1px solid var(--border-subtle); padding-top: 0.5rem;">
                    Distance: ${alt.distanceKm} km from primary temple
                  </div>
                </div>
              `
    ).join("")}
          </div>
        </div>
      ` : ""}

      <!-- Sacred Etiquette Notes -->
      <div style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: var(--radius-md); padding: 1rem 1.25rem;">
        <div style="font-size: 0.82rem; font-weight: 700; color: var(--saffron-500); margin-bottom: 0.4rem;">
          \u{1F4CC} Official Temple Trust Guidelines & Requirements:
        </div>
        <ul style="padding-left: 1.25rem; font-size: 0.8rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.3rem;">
          ${plan.notes.map((note) => `<li>${escapeHtml2(note)}</li>`).join("")}
        </ul>
      </div>
    </div>
  `;
  }
  function escapeHtml2(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  // src/frontend/components/HitlApprovalModal.ts
  function renderHitlApproval(approval, isProcessing = false) {
    return `
    <section class="hitl-approval-barrier fade-in" id="hitl-approval-boundary" role="alertdialog" aria-modal="true" aria-labelledby="hitl-title">
      <div class="hitl-badge">
        <span>\u26A0\uFE0F</span> ACTION REQUIRES YOUR EXPLICIT APPROVAL
      </div>

      <h2 class="hitl-headline" id="hitl-title">
        Autonomous Agent Ready to Reserve Pilgrimage Package
      </h2>

      <p class="hitl-subhead">
        The agent has prepared this booking proposal. As part of the PilgrimOS non-negotiable safety boundary,
        <strong>the agent will NOT continue until you explicitly approve.</strong>
      </p>

      <!-- Key Booking Payload Summary -->
      <div class="hitl-payload-box">
        <div class="hitl-payload-item">
          <span class="hitl-payload-label">Pilgrimage Route</span>
          <span class="hitl-payload-value">${escapeHtml3(approval.route)}</span>
        </div>

        <div class="hitl-payload-item">
          <span class="hitl-payload-label">Dates & Pilgrims</span>
          <span class="hitl-payload-value">${escapeHtml3(approval.travelDates)} \u2022 ${approval.travelersCount} Traveler(s)</span>
        </div>

        <div class="hitl-payload-item">
          <span class="hitl-payload-label">Total Authorized Budget</span>
          <span class="hitl-payload-value price">\u20B9${approval.totalCostInr.toLocaleString("en-IN")}</span>
        </div>
      </div>

      <!-- Itemized Cost Breakdown -->
      <div style="background: rgba(0, 0, 0, 0.35); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem; border: 1px solid rgba(255, 255, 255, 0.08);">
        <div style="font-size: 0.8rem; font-weight: 700; color: #fecdd3; text-transform: uppercase; margin-bottom: 0.75rem;">
          Itemized Reservation Package
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.6rem;">
          ${approval.breakdown.map(
      (item) => `
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.88rem;">
                <span style="color: #cbd5e1;">${escapeHtml3(item.item)}</span>
                <span style="font-weight: 700; color: #ffffff;">\u20B9${item.costInr.toLocaleString("en-IN")}</span>
              </div>
            `
    ).join("")}
        </div>
      </div>

      <!-- Consequences & Safety Notice -->
      <div class="hitl-boundary-notice">
        <span>\u{1F6E1}\uFE0F</span>
        <div>
          <strong>Non-Negotiable Safety Boundary:</strong>
          PilgrimOS never makes irreversible financial transactions, requests banking OTPs, or bypasses your oversight.
          Submitting approval signals intent for backend queuing only.
        </div>
      </div>

      <!-- Explicit Action Bar -->
      <div class="hitl-action-bar">
        <button
          type="button"
          class="btn btn-reject"
          id="btn-reject-approval"
          ${isProcessing ? "disabled" : ""}
        >
          \u2715 Reject &amp; Halt Agent
        </button>

        <button
          type="button"
          class="btn btn-approve"
          id="btn-approve-approval"
          ${isProcessing ? "disabled" : ""}
        >
          ${isProcessing ? "Transmitting Approval Intent..." : "\u2713 Approve &amp; Dispatch Intent"}
        </button>
      </div>
    </section>
  `;
  }
  function escapeHtml3(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  // src/frontend/components/ErrorBanner.ts
  function renderErrorBanner(props) {
    const title = props.title ?? "Agent Pipeline Notification";
    const actionText = props.recoveryText ?? "Try Again";
    return `
    <div class="error-banner fade-in" role="alert">
      <div style="font-size: 1.5rem; flex-shrink: 0; color: var(--rose-500);">\u26A0\uFE0F</div>
      <div style="flex: 1;">
        <div class="error-title">${escapeHtml4(title)}</div>
        <div class="error-message">${escapeHtml4(props.message)}</div>
      </div>
      ${props.recoveryAction ? `
        <button
          type="button"
          class="btn btn-secondary"
          id="btn-error-recovery"
          data-action="${props.recoveryAction}"
          style="font-size: 0.8rem; padding: 0.4rem 0.85rem;"
        >
          ${escapeHtml4(actionText)}
        </button>
      ` : ""}
    </div>
  `;
  }
  function renderRejectionState(reason) {
    return `
    <div class="glass-panel fade-in" style="text-align: center; padding: 3rem 2rem; border-color: rgba(244, 63, 94, 0.4);">
      <div style="font-size: 3rem; margin-bottom: 1rem;">\u{1F6D1}</div>
      <h2 style="font-size: 1.6rem; color: #ffffff; margin-bottom: 0.5rem;">
        Pilgrimage Planning Safely Halted
      </h2>
      <p style="color: #cbd5e1; max-width: 540px; margin: 0 auto 1.5rem; font-size: 0.95rem;">
        ${reason ? escapeHtml4(reason) : "You rejected the autonomous agent proposal. The agent has cleared all pending reservations. Zero charges were made."}
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button type="button" class="btn btn-primary" id="btn-restart-planning">
          \u2728 Plan Another Pilgrimage
        </button>
      </div>
    </div>
  `;
  }
  function renderCompletionState(planTitle, bookingRef) {
    return `
    <div class="glass-panel fade-in" style="text-align: center; padding: 3.5rem 2rem; border-color: rgba(16, 185, 129, 0.4);">
      <div style="font-size: 3.5rem; margin-bottom: 1rem;">\u{1F64F}\u2728</div>
      <h2 style="font-size: 1.8rem; color: #ffffff; margin-bottom: 0.5rem; font-family: var(--font-display);">
        Blessed Journey Confirmed!
      </h2>
      <p style="color: var(--emerald-400); font-weight: 700; font-size: 1.1rem; margin-bottom: 0.5rem;">
        Digital Yatra Pass &amp; Darshan Tokens Synchronized
      </p>
      <p style="color: #94a3b8; max-width: 580px; margin: 0 auto 1.5rem; font-size: 0.92rem;">
        ${escapeHtml4(planTitle)} has been confirmed. Official temple entry barcodes and train tickets are stored in your PilgrimOS offline vault.
      </p>

      <div style="display: inline-block; background: rgba(0,0,0,0.4); padding: 0.75rem 1.5rem; border-radius: var(--radius-md); border: 1px dashed var(--emerald-500); margin-bottom: 2rem;">
        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Temple Trust Verification ID</div>
        <div style="font-family: monospace; font-size: 1.25rem; font-weight: 800; color: #ffffff;">
          ${escapeHtml4(bookingRef)}
        </div>
      </div>

      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button type="button" class="btn btn-secondary" onclick="window.print()">
          \u{1F5A8}\uFE0F Print Yatra Itinerary
        </button>
        <button type="button" class="btn btn-primary" id="btn-restart-planning">
          Plan Another Yatra \u2794
        </button>
      </div>
    </div>
  `;
  }
  function escapeHtml4(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  // src/frontend/main.ts
  var formErrors = {};
  var formValues = {
    originCity: "New Delhi",
    destinationTemple: "Varanasi (Kashi Vishwanath Jyotirlinga)",
    startDate: "2026-09-15",
    endDate: "2026-09-17",
    travelers: 2,
    budgetTier: "standard",
    constraints: {
      seniorCitizenDarshan: true,
      wheelchairAccess: false,
      fastingOrSatvikFood: true,
      nearbyAlternativeTemplesOk: true
    }
  };
  var pollingTimer = null;
  var isSubmitting = false;
  var isInitialized = false;
  function initApp() {
    if (isInitialized) return;
    isInitialized = true;
    setupHeaderControls();
    store.subscribe(renderApp);
  }
  function setupHeaderControls() {
    const btnShadow = document.getElementById("mode-shadow");
    const btnSource = document.getElementById("mode-source");
    btnShadow?.addEventListener("click", () => {
      apiClient.setMode("shadow");
      btnShadow.classList.add("active");
      btnSource?.classList.remove("active");
      store.clearError();
    });
    btnSource?.addEventListener("click", () => {
      apiClient.setMode("source");
      btnSource.classList.add("active");
      btnShadow?.classList.remove("active");
    });
  }
  function renderApp(state) {
    const container = document.getElementById("main-content");
    if (!container) return;
    let html = "";
    html += renderStepper(state.uiState);
    if (state.error) {
      html += renderErrorBanner({
        title: "Agent Encountered an Issue",
        message: state.error,
        recoveryAction: apiClient.mode === "source" ? "switch_demo" : "reset",
        recoveryText: apiClient.mode === "source" ? "Switch to Demo Mode" : "Restart Form"
      });
    }
    switch (state.uiState) {
      case "IDLE":
        html += renderRequestForm(formValues, formErrors, isSubmitting);
        break;
      case "PLANNING":
      case "RESEARCHING":
        if (state.status) {
          html += renderLiveStatus(state.status);
        }
        break;
      case "RESULTS_READY":
        if (state.plan) {
          html += renderJourneyPlan(state.plan, state.availability);
        }
        break;
      case "APPROVAL_REQUIRED":
        if (state.plan) {
          html += renderJourneyPlan(state.plan, state.availability);
        }
        if (state.approval) {
          html += renderHitlApproval(state.approval, isSubmitting);
        }
        break;
      case "APPROVED":
        if (state.status) {
          html += renderLiveStatus(state.status);
        }
        break;
      case "REJECTED":
        html += renderRejectionState(state.approvalResponse?.reason);
        break;
      case "COMPLETED":
        html += renderCompletionState(
          state.plan?.title ?? "Sacred Pilgrimage Yatra",
          "TT-8849201-DARSHAN"
        );
        break;
      case "FAILED":
        break;
    }
    container.innerHTML = html;
    attachViewEventListeners(state);
    const consoleEl = document.getElementById("agent-console");
    if (consoleEl) {
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }
  }
  function attachViewEventListeners(state) {
    document.querySelectorAll(".preset-chip").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const preset = btn.dataset.preset;
        applyPreset(preset);
      });
    });
    const form = document.getElementById("pilgrimage-request-form");
    if (form) {
      form.addEventListener("submit", handleFormSubmit);
    }
    const btnApprove = document.getElementById("btn-approve-approval");
    if (btnApprove) {
      btnApprove.addEventListener("click", handleApprove);
    }
    const btnReject = document.getElementById("btn-reject-approval");
    if (btnReject) {
      btnReject.addEventListener("click", handleReject);
    }
    const btnRestart = document.getElementById("btn-restart-planning");
    if (btnRestart) {
      btnRestart.addEventListener("click", handleReset);
    }
    const btnRecovery = document.getElementById("btn-error-recovery");
    if (btnRecovery) {
      btnRecovery.addEventListener("click", () => {
        const action = btnRecovery.getAttribute("data-action");
        if (action === "switch_demo") {
          const btnShadow = document.getElementById("mode-shadow");
          const btnSource = document.getElementById("mode-source");
          apiClient.setMode("shadow");
          btnShadow?.classList.add("active");
          btnSource?.classList.remove("active");
          store.clearError();
          store.setState({ uiState: "IDLE" });
        } else {
          handleReset();
        }
      });
    }
  }
  function applyPreset(preset) {
    switch (preset) {
      case "varanasi":
        formValues = {
          originCity: "New Delhi",
          destinationTemple: "Varanasi (Kashi Vishwanath Jyotirlinga)",
          startDate: "2026-09-15",
          endDate: "2026-09-17",
          travelers: 2,
          budgetTier: "standard",
          constraints: {
            seniorCitizenDarshan: true,
            wheelchairAccess: false,
            fastingOrSatvikFood: true,
            nearbyAlternativeTemplesOk: true
          }
        };
        break;
      case "tirupati":
        formValues = {
          originCity: "Bengaluru",
          destinationTemple: "Tirupati (Sri Venkateswara Swami, Tirumala)",
          startDate: "2026-09-18",
          endDate: "2026-09-20",
          travelers: 3,
          budgetTier: "premium",
          constraints: {
            seniorCitizenDarshan: true,
            wheelchairAccess: false,
            fastingOrSatvikFood: true,
            nearbyAlternativeTemplesOk: true
          }
        };
        break;
      case "vaishnodevi":
        formValues = {
          originCity: "New Delhi",
          destinationTemple: "Vaishno Devi (Mata Vaishno Devi Shrine, Katra)",
          startDate: "2026-09-22",
          endDate: "2026-09-25",
          travelers: 2,
          budgetTier: "standard",
          constraints: {
            seniorCitizenDarshan: false,
            wheelchairAccess: false,
            fastingOrSatvikFood: true,
            nearbyAlternativeTemplesOk: true
          }
        };
        break;
      case "shirdi":
        formValues = {
          originCity: "Mumbai",
          destinationTemple: "Shirdi (Sai Baba Sansthan)",
          startDate: "2026-09-26",
          endDate: "2026-09-28",
          travelers: 4,
          budgetTier: "budget",
          constraints: {
            seniorCitizenDarshan: true,
            wheelchairAccess: true,
            fastingOrSatvikFood: true,
            nearbyAlternativeTemplesOk: false
          }
        };
        break;
    }
    formErrors = {};
    store.setState({ uiState: "IDLE" });
  }
  async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    formValues = {
      originCity: formData.get("originCity")?.trim() ?? "",
      destinationTemple: formData.get("destinationTemple")?.trim() ?? "",
      startDate: formData.get("startDate")?.trim() ?? "",
      endDate: formData.get("endDate")?.trim() ?? "",
      travelers: parseInt(formData.get("travelers") || "1", 10),
      budgetTier: formData.get("budgetTier") || "standard",
      constraints: {
        seniorCitizenDarshan: formData.has("seniorCitizenDarshan"),
        wheelchairAccess: formData.has("wheelchairAccess"),
        fastingOrSatvikFood: formData.has("fastingOrSatvikFood"),
        nearbyAlternativeTemplesOk: formData.has("nearbyAlternativeTemplesOk")
      }
    };
    formErrors = validateForm(formValues);
    if (Object.keys(formErrors).length > 0) {
      store.setState({ uiState: "IDLE" });
      return;
    }
    isSubmitting = true;
    store.clearError();
    try {
      const created = await apiClient.adapter.createPilgrimageRequest({
        originCity: formValues.originCity,
        destinationTemple: formValues.destinationTemple,
        startDate: formValues.startDate,
        endDate: formValues.endDate,
        travelers: formValues.travelers,
        budgetTier: formValues.budgetTier,
        constraints: formValues.constraints
      });
      store.setState({
        request: created,
        uiState: "PLANNING"
      });
      startPolling(created.id);
    } catch (err) {
      store.setError(
        `Could not initialize pilgrimage request: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      isSubmitting = false;
    }
  }
  function startPolling(requestId) {
    if (pollingTimer) clearInterval(pollingTimer);
    pollingTimer = setInterval(async () => {
      try {
        const status = await apiClient.adapter.getAgentStatus(requestId);
        const updates = { status, uiState: status.uiState };
        if (["RESULTS_READY", "APPROVAL_REQUIRED", "APPROVED", "COMPLETED"].includes(status.uiState)) {
          const [plan, availability, approval] = await Promise.all([
            apiClient.adapter.getJourneyPlan(requestId),
            apiClient.adapter.getAvailability(requestId),
            apiClient.adapter.getApprovalRequest(requestId)
          ]);
          if (plan) updates.plan = plan;
          if (availability) updates.availability = availability;
          if (approval) updates.approval = approval;
        }
        store.setState(updates);
        if (["COMPLETED", "REJECTED", "FAILED"].includes(status.uiState)) {
          if (pollingTimer) clearInterval(pollingTimer);
        }
      } catch (err) {
        if (pollingTimer) clearInterval(pollingTimer);
        store.setError(
          `Lost connection to agent pipeline: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }, 600);
  }
  async function handleApprove() {
    const state = store.getState();
    if (!state.request) return;
    isSubmitting = true;
    store.setState({ isPolling: true });
    try {
      const response = await apiClient.adapter.submitApproval(state.request.id);
      store.setState({
        approvalResponse: response,
        uiState: "APPROVED"
      });
    } catch (err) {
      store.setError(
        `Approval transmission failed: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      isSubmitting = false;
    }
  }
  async function handleReject() {
    const state = store.getState();
    if (!state.request) return;
    isSubmitting = true;
    try {
      const response = await apiClient.adapter.submitRejection(
        state.request.id,
        "User decided not to proceed with the proposed reservation."
      );
      if (pollingTimer) clearInterval(pollingTimer);
      store.setState({
        approvalResponse: response,
        uiState: "REJECTED"
      });
    } catch (err) {
      store.setError(
        `Rejection failed: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      isSubmitting = false;
    }
  }
  function handleReset() {
    if (pollingTimer) clearInterval(pollingTimer);
    store.reset();
    formErrors = {};
  }
  if (typeof window !== "undefined") {
    window.addEventListener("DOMContentLoaded", initApp);
    if (document.readyState === "complete" || document.readyState === "interactive") {
      initApp();
    }
  }
  return __toCommonJS(main_exports);
})();
//# sourceMappingURL=bundle.js.map
