/* ==========================================================================
   PILGRIMOS STATE STORE
   Reactive state management for the autonomous agent workflow
   ========================================================================== */

import type {
  AppUiState,
  PilgrimageRequest,
  AgentStatus,
  JourneyPlan,
  AvailabilityResult,
  ApprovalRequest,
  ApprovalResponse,
} from '../types/index.js';

export interface AppState {
  uiState: AppUiState;
  request: PilgrimageRequest | null;
  status: AgentStatus | null;
  plan: JourneyPlan | null;
  availability: AvailabilityResult | null;
  approval: ApprovalRequest | null;
  approvalResponse: ApprovalResponse | null;
  error: string | null;
  isPolling: boolean;
}

type StateListener = (state: AppState) => void;

class Store {
  private state: AppState = {
    uiState: 'IDLE',
    request: null,
    status: null,
    plan: null,
    availability: null,
    approval: null,
    approvalResponse: null,
    error: null,
    isPolling: false,
  };

  private listeners: Set<StateListener> = new Set();

  getState(): AppState {
    return { ...this.state };
  }

  setState(partial: Partial<AppState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const current = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(current);
      } catch (err) {
        console.error('Error in store listener:', err);
      }
    });
  }

  reset(): void {
    this.setState({
      uiState: 'IDLE',
      request: null,
      status: null,
      plan: null,
      availability: null,
      approval: null,
      approvalResponse: null,
      error: null,
      isPolling: false,
    });
  }

  setError(error: string): void {
    this.setState({
      error,
      uiState: 'FAILED',
      isPolling: false,
    });
  }

  clearError(): void {
    this.setState({ error: null });
  }
}

export const store = new Store();
