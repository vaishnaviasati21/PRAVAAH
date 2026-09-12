/* ==========================================================================
   PILGRIMOS FRONTEND APPLICATION ENTRYPOINT
   Autonomous Pilgrimage Agent Orchestrator & View Renderer
   ========================================================================== */

import { store, type AppState } from './state/store.js';
import { apiClient } from './api/client.js';
import { renderStepper } from './components/Stepper.js';
import { renderRequestForm, validateForm, type FormValidationErrors } from './components/RequestForm.js';
import { renderLiveStatus } from './components/LiveStatus.js';
import { renderJourneyPlan } from './components/JourneyPlanView.js';
import { renderHitlApproval } from './components/HitlApprovalModal.js';
import { renderErrorBanner, renderRejectionState, renderCompletionState } from './components/ErrorBanner.js';
import type { PilgrimageRequest } from './types/index.js';

let formErrors: FormValidationErrors = {};
let formValues: Partial<PilgrimageRequest> = {
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
};

let pollingTimer: ReturnType<typeof setInterval> | null = null;
let isSubmitting = false;
let isInitialized = false;

// --------------------------------------------------------------------------
// Initialization
// --------------------------------------------------------------------------
export function initApp(): void {
  if (isInitialized) return;
  isInitialized = true;
  setupHeaderControls();
  store.subscribe(renderApp);
}

function setupHeaderControls(): void {
  const btnShadow = document.getElementById('mode-shadow');
  const btnSource = document.getElementById('mode-source');

  btnShadow?.addEventListener('click', () => {
    apiClient.setMode('shadow');
    btnShadow.classList.add('active');
    btnSource?.classList.remove('active');
    store.clearError();
  });

  btnSource?.addEventListener('click', () => {
    apiClient.setMode('source');
    btnSource.classList.add('active');
    btnShadow?.classList.remove('active');
  });
}

// --------------------------------------------------------------------------
// Render App View
// --------------------------------------------------------------------------
function renderApp(state: AppState): void {
  const container = document.getElementById('main-content');
  if (!container) return;

  let html = '';

  // 1. Always display the pipeline stepper at the top
  html += renderStepper(state.uiState);

  // 2. Error Banner if present
  if (state.error) {
    html += renderErrorBanner({
      title: 'Agent Encountered an Issue',
      message: state.error,
      recoveryAction: apiClient.mode === 'source' ? 'switch_demo' : 'reset',
      recoveryText: apiClient.mode === 'source' ? 'Switch to Demo Mode' : 'Restart Form',
    });
  }

  // 3. View Switcher based on UI State
  switch (state.uiState) {
    case 'IDLE':
      html += renderRequestForm(formValues, formErrors, isSubmitting);
      break;

    case 'PLANNING':
    case 'RESEARCHING':
      if (state.status) {
        html += renderLiveStatus(state.status);
      }
      break;

    case 'RESULTS_READY':
      if (state.plan) {
        html += renderJourneyPlan(state.plan, state.availability);
      }
      break;

    case 'APPROVAL_REQUIRED':
      // The most critical safety moment: Journey plan displayed, then prominent HITL gate
      if (state.plan) {
        html += renderJourneyPlan(state.plan, state.availability);
      }
      if (state.approval) {
        html += renderHitlApproval(state.approval, isSubmitting);
      }
      break;

    case 'APPROVED':
      if (state.status) {
        html += renderLiveStatus(state.status);
      }
      break;

    case 'REJECTED':
      html += renderRejectionState(state.approvalResponse?.reason);
      break;

    case 'COMPLETED':
      html += renderCompletionState(
        state.plan?.title ?? 'Sacred Pilgrimage Yatra',
        'TT-8849201-DARSHAN'
      );
      break;

    case 'FAILED':
      // Handled by error banner above
      break;
  }

  container.innerHTML = html;
  attachViewEventListeners(state);

  // Auto-scroll terminal console if active
  const consoleEl = document.getElementById('agent-console');
  if (consoleEl) {
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }
}

// --------------------------------------------------------------------------
// Event Listeners Wiring
// --------------------------------------------------------------------------
function attachViewEventListeners(state: AppState): void {
  // Preset Buttons
  document.querySelectorAll<HTMLButtonElement>('.preset-chip').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const preset = btn.dataset.preset;
      applyPreset(preset);
    });
  });

  // Pilgrimage Request Form Submit
  const form = document.getElementById('pilgrimage-request-form') as HTMLFormElement | null;
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  // HITL Approval Buttons
  const btnApprove = document.getElementById('btn-approve-approval');
  if (btnApprove) {
    btnApprove.addEventListener('click', handleApprove);
  }

  const btnReject = document.getElementById('btn-reject-approval');
  if (btnReject) {
    btnReject.addEventListener('click', handleReject);
  }

  // Restart / Reset Buttons
  const btnRestart = document.getElementById('btn-restart-planning');
  if (btnRestart) {
    btnRestart.addEventListener('click', handleReset);
  }

  // Error Recovery Button
  const btnRecovery = document.getElementById('btn-error-recovery');
  if (btnRecovery) {
    btnRecovery.addEventListener('click', () => {
      const action = btnRecovery.getAttribute('data-action');
      if (action === 'switch_demo') {
        const btnShadow = document.getElementById('mode-shadow');
        const btnSource = document.getElementById('mode-source');
        apiClient.setMode('shadow');
        btnShadow?.classList.add('active');
        btnSource?.classList.remove('active');
        store.clearError();
        store.setState({ uiState: 'IDLE' });
      } else {
        handleReset();
      }
    });
  }
}

// --------------------------------------------------------------------------
// Preset Configurations
// --------------------------------------------------------------------------
function applyPreset(preset?: string): void {
  switch (preset) {
    case 'varanasi':
      formValues = {
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
      };
      break;

    case 'tirupati':
      formValues = {
        originCity: 'Bengaluru',
        destinationTemple: 'Tirupati (Sri Venkateswara Swami, Tirumala)',
        startDate: '2026-09-18',
        endDate: '2026-09-20',
        travelers: 3,
        budgetTier: 'premium',
        constraints: {
          seniorCitizenDarshan: true,
          wheelchairAccess: false,
          fastingOrSatvikFood: true,
          nearbyAlternativeTemplesOk: true,
        },
      };
      break;

    case 'vaishnodevi':
      formValues = {
        originCity: 'New Delhi',
        destinationTemple: 'Vaishno Devi (Mata Vaishno Devi Shrine, Katra)',
        startDate: '2026-09-22',
        endDate: '2026-09-25',
        travelers: 2,
        budgetTier: 'standard',
        constraints: {
          seniorCitizenDarshan: false,
          wheelchairAccess: false,
          fastingOrSatvikFood: true,
          nearbyAlternativeTemplesOk: true,
        },
      };
      break;

    case 'shirdi':
      formValues = {
        originCity: 'Mumbai',
        destinationTemple: 'Shirdi (Sai Baba Sansthan)',
        startDate: '2026-09-26',
        endDate: '2026-09-28',
        travelers: 4,
        budgetTier: 'budget',
        constraints: {
          seniorCitizenDarshan: true,
          wheelchairAccess: true,
          fastingOrSatvikFood: true,
          nearbyAlternativeTemplesOk: false,
        },
      };
      break;
  }

  formErrors = {};
  store.setState({ uiState: 'IDLE' });
}

// --------------------------------------------------------------------------
// Form Handler
// --------------------------------------------------------------------------
async function handleFormSubmit(e: Event): Promise<void> {
  e.preventDefault();

  const form = e.target as HTMLFormElement;
  const formData = new FormData(form);

  formValues = {
    originCity: (formData.get('originCity') as string)?.trim() ?? '',
    destinationTemple: (formData.get('destinationTemple') as string)?.trim() ?? '',
    startDate: (formData.get('startDate') as string)?.trim() ?? '',
    endDate: (formData.get('endDate') as string)?.trim() ?? '',
    travelers: parseInt((formData.get('travelers') as string) || '1', 10),
    budgetTier: (formData.get('budgetTier') as any) || 'standard',
    constraints: {
      seniorCitizenDarshan: formData.has('seniorCitizenDarshan'),
      wheelchairAccess: formData.has('wheelchairAccess'),
      fastingOrSatvikFood: formData.has('fastingOrSatvikFood'),
      nearbyAlternativeTemplesOk: formData.has('nearbyAlternativeTemplesOk'),
    },
  };

  formErrors = validateForm(formValues);
  if (Object.keys(formErrors).length > 0) {
    store.setState({ uiState: 'IDLE' });
    return;
  }

  isSubmitting = true;
  store.clearError();

  try {
    const created = await apiClient.adapter.createPilgrimageRequest({
      originCity: formValues.originCity!,
      destinationTemple: formValues.destinationTemple!,
      startDate: formValues.startDate!,
      endDate: formValues.endDate!,
      travelers: formValues.travelers!,
      budgetTier: formValues.budgetTier!,
      constraints: formValues.constraints!,
    });

    store.setState({
      request: created,
      uiState: 'PLANNING',
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

// --------------------------------------------------------------------------
// Polling Routine for Progressive Status
// --------------------------------------------------------------------------
function startPolling(requestId: string): void {
  if (pollingTimer) clearInterval(pollingTimer);

  pollingTimer = setInterval(async () => {
    try {
      const status = await apiClient.adapter.getAgentStatus(requestId);
      const updates: Partial<AppState> = { status, uiState: status.uiState };

      // When data is ready, fetch journey plan, availability, and approval request
      if (
        ['RESULTS_READY', 'APPROVAL_REQUIRED', 'APPROVED', 'COMPLETED'].includes(status.uiState)
      ) {
        const [plan, availability, approval] = await Promise.all([
          apiClient.adapter.getJourneyPlan(requestId),
          apiClient.adapter.getAvailability(requestId),
          apiClient.adapter.getApprovalRequest(requestId),
        ]);

        if (plan) updates.plan = plan;
        if (availability) updates.availability = availability;
        if (approval) updates.approval = approval;
      }

      store.setState(updates);

      // Stop polling once finalized
      if (['COMPLETED', 'REJECTED', 'FAILED'].includes(status.uiState)) {
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

// --------------------------------------------------------------------------
// HITL Approval Intent Handlers
// --------------------------------------------------------------------------
async function handleApprove(): Promise<void> {
  const state = store.getState();
  if (!state.request) return;

  isSubmitting = true;
  store.setState({ isPolling: true });

  try {
    const response = await apiClient.adapter.submitApproval(state.request.id);
    store.setState({
      approvalResponse: response,
      uiState: 'APPROVED',
    });
  } catch (err) {
    store.setError(
      `Approval transmission failed: ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    isSubmitting = false;
  }
}

async function handleReject(): Promise<void> {
  const state = store.getState();
  if (!state.request) return;

  isSubmitting = true;

  try {
    const response = await apiClient.adapter.submitRejection(
      state.request.id,
      'User decided not to proceed with the proposed reservation.'
    );
    if (pollingTimer) clearInterval(pollingTimer);
    store.setState({
      approvalResponse: response,
      uiState: 'REJECTED',
    });
  } catch (err) {
    store.setError(
      `Rejection failed: ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    isSubmitting = false;
  }
}

function handleReset(): void {
  if (pollingTimer) clearInterval(pollingTimer);
  store.reset();
  formErrors = {};
}

// --------------------------------------------------------------------------
// Start Application
// --------------------------------------------------------------------------
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', initApp);
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initApp();
  }
}
