/* ==========================================================================
   PILGRIMOS ERROR BANNER & RECOVERY COMPONENT
   Plain-language recovery cards for backend issues, timeouts, or rejections
   ========================================================================== */

export interface ErrorBannerProps {
  title?: string;
  message: string;
  recoveryAction?: 'retry' | 'switch_demo' | 'reset' | 'modify';
  recoveryText?: string;
}

export function renderErrorBanner(props: ErrorBannerProps): string {
  const title = props.title ?? 'Agent Pipeline Notification';
  const actionText = props.recoveryText ?? 'Try Again';

  return `
    <div class="error-banner fade-in" role="alert">
      <div style="font-size: 1.5rem; flex-shrink: 0; color: var(--rose-500);">⚠️</div>
      <div style="flex: 1;">
        <div class="error-title">${escapeHtml(title)}</div>
        <div class="error-message">${escapeHtml(props.message)}</div>
      </div>
      ${
        props.recoveryAction
          ? `
        <button
          type="button"
          class="btn btn-secondary"
          id="btn-error-recovery"
          data-action="${props.recoveryAction}"
          style="font-size: 0.8rem; padding: 0.4rem 0.85rem;"
        >
          ${escapeHtml(actionText)}
        </button>
      `
          : ''
      }
    </div>
  `;
}

export function renderRejectionState(reason?: string): string {
  return `
    <div class="glass-panel fade-in" style="text-align: center; padding: 3rem 2rem; border-color: rgba(244, 63, 94, 0.4);">
      <div style="font-size: 3rem; margin-bottom: 1rem;">🛑</div>
      <h2 style="font-size: 1.6rem; color: #ffffff; margin-bottom: 0.5rem;">
        Pilgrimage Planning Safely Halted
      </h2>
      <p style="color: #cbd5e1; max-width: 540px; margin: 0 auto 1.5rem; font-size: 0.95rem;">
        ${reason ? escapeHtml(reason) : 'You rejected the autonomous agent proposal. The agent has cleared all pending reservations. Zero charges were made.'}
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button type="button" class="btn btn-primary" id="btn-restart-planning">
          ✨ Plan Another Pilgrimage
        </button>
      </div>
    </div>
  `;
}

export function renderCompletionState(planTitle: string, bookingRef: string): string {
  return `
    <div class="glass-panel fade-in" style="text-align: center; padding: 3.5rem 2rem; border-color: rgba(16, 185, 129, 0.4);">
      <div style="font-size: 3.5rem; margin-bottom: 1rem;">🙏✨</div>
      <h2 style="font-size: 1.8rem; color: #ffffff; margin-bottom: 0.5rem; font-family: var(--font-display);">
        Blessed Journey Confirmed!
      </h2>
      <p style="color: var(--emerald-400); font-weight: 700; font-size: 1.1rem; margin-bottom: 0.5rem;">
        Digital Yatra Pass &amp; Darshan Tokens Synchronized
      </p>
      <p style="color: #94a3b8; max-width: 580px; margin: 0 auto 1.5rem; font-size: 0.92rem;">
        ${escapeHtml(planTitle)} has been confirmed. Official temple entry barcodes and train tickets are stored in your PilgrimOS offline vault.
      </p>

      <div style="display: inline-block; background: rgba(0,0,0,0.4); padding: 0.75rem 1.5rem; border-radius: var(--radius-md); border: 1px dashed var(--emerald-500); margin-bottom: 2rem;">
        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Temple Trust Verification ID</div>
        <div style="font-family: monospace; font-size: 1.25rem; font-weight: 800; color: #ffffff;">
          ${escapeHtml(bookingRef)}
        </div>
      </div>

      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button type="button" class="btn btn-secondary" onclick="window.print()">
          🖨️ Print Yatra Itinerary
        </button>
        <button type="button" class="btn btn-primary" id="btn-restart-planning">
          Plan Another Yatra ➔
        </button>
      </div>
    </div>
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
