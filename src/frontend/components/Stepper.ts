/* ==========================================================================
   PILGRIMOS STEPPER COMPONENT
   Visual breadcrumb showing the autonomous pipeline stages & safety gate
   ========================================================================== */

import type { AppUiState } from '../types/index.js';

export function renderStepper(uiState: AppUiState): string {
  const steps: Array<{
    key: string;
    label: string;
    num: string;
    isApproval?: boolean;
    isActive: boolean;
    isCompleted: boolean;
  }> = [
    {
      key: 'request',
      label: '1. Request',
      num: '1',
      isActive: uiState === 'IDLE' || uiState === 'PLANNING',
      isCompleted: !['IDLE', 'PLANNING'].includes(uiState),
    },
    {
      key: 'research',
      label: '2. Agent Research',
      num: '2',
      isActive: uiState === 'RESEARCHING',
      isCompleted: ['RESULTS_READY', 'APPROVAL_REQUIRED', 'APPROVED', 'REJECTED', 'COMPLETED'].includes(uiState),
    },
    {
      key: 'results',
      label: '3. Journey & Slots',
      num: '3',
      isActive: uiState === 'RESULTS_READY',
      isCompleted: ['APPROVAL_REQUIRED', 'APPROVED', 'REJECTED', 'COMPLETED'].includes(uiState),
    },
    {
      key: 'approval',
      label: '4. HITL Approval',
      num: '!',
      isApproval: true,
      isActive: uiState === 'APPROVAL_REQUIRED',
      isCompleted: ['APPROVED', 'COMPLETED'].includes(uiState),
    },
    {
      key: 'completion',
      label: '5. Synchronized',
      num: '✓',
      isActive: uiState === 'APPROVED' || uiState === 'COMPLETED',
      isCompleted: uiState === 'COMPLETED',
    },
  ];

  return `
    <div class="stepper-container fade-in">
      <div class="stepper-track">
        ${steps
          .map((step) => {
            const classList = [
              'stepper-step',
              step.isActive ? 'active' : '',
              step.isCompleted ? 'completed' : '',
              step.isApproval ? 'approval-step' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return `
              <div class="${classList}">
                <div class="step-node">${step.isCompleted ? '✓' : step.num}</div>
                <div class="step-label">${step.label}</div>
              </div>
            `;
          })
          .join('')}
      </div>
    </div>
  `;
}
