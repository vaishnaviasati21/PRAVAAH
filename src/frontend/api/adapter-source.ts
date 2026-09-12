/* ==========================================================================
   PILGRIMOS SOURCE ADAPTER
   Real HTTP client implementation for connecting to orchestrator backend
   Follows the pattern from src/hosted/client.ts
   ========================================================================== */

import type { PilgrimosApiAdapter } from './adapter-interface.js';
import type {
  PilgrimageRequest,
  AgentStatus,
  JourneyPlan,
  AvailabilityResult,
  ApprovalRequest,
  ApprovalResponse,
} from '../types/index.js';

export interface SourceAdapterOptions {
  apiBaseUrl?: string;
  fetchImpl?: typeof fetch;
}

export class SourcePilgrimosAdapter implements PilgrimosApiAdapter {
  readonly modeName = 'source' as const;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: SourceAdapterOptions = {}) {
    this.baseUrl = (options.apiBaseUrl ?? 'http://localhost:3000/api/pilgrimos').replace(/\/+$/, '');
    if (options.fetchImpl) {
      this.fetchImpl = options.fetchImpl;
    } else if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      this.fetchImpl = window.fetch.bind(window);
    } else if (typeof fetch === 'function') {
      this.fetchImpl = fetch;
    } else {
      this.fetchImpl = (() => {
        throw new Error('No fetch implementation available in current runtime environment.');
      }) as any;
    }
  }

  async createPilgrimageRequest(
    input: Omit<PilgrimageRequest, 'id' | 'createdAt'>
  ): Promise<PilgrimageRequest> {
    const data = await this.postJson<{ ok: true; request: PilgrimageRequest }>('/requests', input);
    return data.request;
  }

  async getAgentStatus(requestId: string): Promise<AgentStatus> {
    const data = await this.getJson<{ ok: true; status: AgentStatus }>(
      `/requests/${encodeURIComponent(requestId)}/status`
    );
    return data.status;
  }

  async getJourneyPlan(requestId: string): Promise<JourneyPlan | null> {
    const data = await this.getJson<{ ok: true; plan: JourneyPlan | null }>(
      `/requests/${encodeURIComponent(requestId)}/plan`
    );
    return data.plan;
  }

  async getAvailability(requestId: string): Promise<AvailabilityResult | null> {
    const data = await this.getJson<{ ok: true; availability: AvailabilityResult | null }>(
      `/requests/${encodeURIComponent(requestId)}/availability`
    );
    return data.availability;
  }

  async getApprovalRequest(requestId: string): Promise<ApprovalRequest | null> {
    const data = await this.getJson<{ ok: true; approval: ApprovalRequest | null }>(
      `/requests/${encodeURIComponent(requestId)}/approval`
    );
    return data.approval;
  }

  async submitApproval(requestId: string): Promise<ApprovalResponse> {
    const data = await this.postJson<{ ok: true; response: ApprovalResponse }>(
      `/requests/${encodeURIComponent(requestId)}/approval/approve`,
      {}
    );
    return data.response;
  }

  async submitRejection(requestId: string, reason?: string): Promise<ApprovalResponse> {
    const data = await this.postJson<{ ok: true; response: ApprovalResponse }>(
      `/requests/${encodeURIComponent(requestId)}/approval/reject`,
      { reason }
    );
    return data.response;
  }

  async cancelPilgrimage(requestId: string): Promise<void> {
    await this.postJson<{ ok: true }>(`/requests/${encodeURIComponent(requestId)}/cancel`, {});
  }

  // --- Network Helpers ---
  private async getJson<T>(path: string): Promise<T> {
    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Backend returned HTTP ${response.status}: ${response.statusText}`);
      }
      return (await response.json()) as T;
    } catch (err) {
      throw new Error(
        `Failed to reach backend at ${this.baseUrl}${path}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  private async postJson<T>(path: string, body: unknown): Promise<T> {
    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`Backend returned HTTP ${response.status}: ${response.statusText}`);
      }
      return (await response.json()) as T;
    } catch (err) {
      throw new Error(
        `Failed to reach backend at ${this.baseUrl}${path}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
}
