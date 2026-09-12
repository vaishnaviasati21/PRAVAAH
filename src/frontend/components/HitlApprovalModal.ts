/* ==========================================================================
   PILGRIMOS HUMAN-IN-THE-LOOP (HITL) APPROVAL BOUNDARY
   CRITICAL SAFETY GATE: The single most visually prominent moment in the flow.
   Never executes booking/payment directly.
   ========================================================================== */

import type { ApprovalRequest } from '../types/index.js';

export function renderHitlApproval(approval: ApprovalRequest, isProcessing = false): string {
  return `
    <section class="hitl-approval-barrier fade-in" id="hitl-approval-boundary" role="alertdialog" aria-modal="true" aria-labelledby="hitl-title">
      <div class="hitl-badge">
        <span>⚠️</span> ACTION REQUIRES YOUR EXPLICIT APPROVAL
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
          <span class="hitl-payload-value">${escapeHtml(approval.route)}</span>
        </div>

        <div class="hitl-payload-item">
          <span class="hitl-payload-label">Dates & Pilgrims</span>
          <span class="hitl-payload-value">${escapeHtml(approval.travelDates)} • ${approval.travelersCount} Traveler(s)</span>
        </div>

        <div class="hitl-payload-item">
          <span class="hitl-payload-label">Total Authorized Budget</span>
          <span class="hitl-payload-value price">₹${approval.totalCostInr.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <!-- Itemized Cost Breakdown -->
      <div style="background: rgba(0, 0, 0, 0.35); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem; border: 1px solid rgba(255, 255, 255, 0.08);">
        <div style="font-size: 0.8rem; font-weight: 700; color: #fecdd3; text-transform: uppercase; margin-bottom: 0.75rem;">
          Itemized Reservation Package
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.6rem;">
          ${approval.breakdown
            .map(
              (item) => `
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.88rem;">
                <span style="color: #cbd5e1;">${escapeHtml(item.item)}</span>
                <span style="font-weight: 700; color: #ffffff;">₹${item.costInr.toLocaleString('en-IN')}</span>
              </div>
            `
            )
            .join('')}
        </div>
      </div>

      <!-- Consequences & Safety Notice -->
      <div class="hitl-boundary-notice">
        <span>🛡️</span>
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
          ${isProcessing ? 'disabled' : ''}
        >
          ✕ Reject &amp; Halt Agent
        </button>

        <button
          type="button"
          class="btn btn-approve"
          id="btn-approve-approval"
          ${isProcessing ? 'disabled' : ''}
        >
          ${isProcessing ? 'Transmitting Approval Intent...' : '✓ Approve &amp; Dispatch Intent'}
        </button>
      </div>
    </section>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
