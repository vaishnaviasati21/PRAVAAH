/* ==========================================================================
   PILGRIMOS API ADAPTER CONTRACT
   Typed abstraction to decouple UI from network / mock implementations
   ========================================================================== */

import type {
  PilgrimageRequest,
  AgentStatus,
  JourneyPlan,
  AvailabilityResult,
  ApprovalRequest,
  ApprovalResponse,
} from '../types/index.js';

export interface PilgrimosApiAdapter {
  readonly modeName: 'shadow' | 'source';

  /** Initiates a new pilgrimage planning task with the agent */
  createPilgrimageRequest(
    input: Omit<PilgrimageRequest, 'id' | 'createdAt'>
  ): Promise<PilgrimageRequest>;

  /** Queries progressive execution status, logs, and state */
  getAgentStatus(requestId: string): Promise<AgentStatus>;

  /** Retrieves generated itinerary, recommendations, and costs */
  getJourneyPlan(requestId: string): Promise<JourneyPlan | null>;

  /** Retrieves real-time transport, stay, darshan slots, and crowd density */
  getAvailability(requestId: string): Promise<AvailabilityResult | null>;

  /** Fetches pending approval details if state is APPROVAL_REQUIRED */
  getApprovalRequest(requestId: string): Promise<ApprovalRequest | null>;

  /** Submits human approval intent (frontend never executes booking directly) */
  submitApproval(requestId: string): Promise<ApprovalResponse>;

  /** Submits human rejection intent to cancel or revise booking */
  submitRejection(requestId: string, reason?: string): Promise<ApprovalResponse>;

  /** Cancels or resets current agent task */
  cancelPilgrimage(requestId: string): Promise<void>;
}
