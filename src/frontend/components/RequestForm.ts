/* ==========================================================================
   PILGRIMOS PILGRIMAGE REQUEST FORM COMPONENT
   Form with real validation, inline errors, and rapid presets for hackathon demo
   ========================================================================== */

import type { PilgrimageRequest, BudgetTier } from '../types/index.js';

export interface FormValidationErrors {
  originCity?: string;
  destinationTemple?: string;
  startDate?: string;
  endDate?: string;
  travelers?: string;
}

export function validateForm(data: Partial<PilgrimageRequest>): FormValidationErrors {
  const errors: FormValidationErrors = {};

  if (!data.originCity || data.originCity.trim().length < 2) {
    errors.originCity = 'Please enter a valid starting city or airport/rail hub.';
  }

  if (!data.destinationTemple || data.destinationTemple.trim().length < 3) {
    errors.destinationTemple = 'Please choose a pilgrimage temple destination.';
  }

  if (!data.startDate) {
    errors.startDate = 'Please select your pilgrimage start date.';
  }

  if (!data.endDate) {
    errors.endDate = 'Please select your return date.';
  } else if (data.startDate && data.endDate < data.startDate) {
    errors.endDate = 'Return date cannot be earlier than start date.';
  }

  if (!data.travelers || data.travelers < 1) {
    errors.travelers = 'Must have at least 1 pilgrim.';
  } else if (data.travelers > 20) {
    errors.travelers = 'For groups over 20, contact Temple Trust Group Desk.';
  }

  return errors;
}

export function renderRequestForm(
  initialData?: Partial<PilgrimageRequest>,
  errors: FormValidationErrors = {},
  isSubmitting = false
): string {
  const origin = initialData?.originCity ?? 'New Delhi';
  const destination = initialData?.destinationTemple ?? 'Varanasi (Kashi Vishwanath Jyotirlinga)';
  const startDate = initialData?.startDate ?? '2026-09-15';
  const endDate = initialData?.endDate ?? '2026-09-17';
  const travelers = initialData?.travelers ?? 2;
  const budget: BudgetTier = initialData?.budgetTier ?? 'standard';
  const senior = initialData?.constraints?.seniorCitizenDarshan ?? true;
  const wheelchair = initialData?.constraints?.wheelchairAccess ?? false;
  const satvik = initialData?.constraints?.fastingOrSatvikFood ?? true;
  const alternatives = initialData?.constraints?.nearbyAlternativeTemplesOk ?? true;

  return `
    <div class="glass-panel fade-in">
      <div class="panel-header">
        <h1 class="panel-header-title">
          <span>✨</span> Plan Your Autonomous Pilgrimage
        </h1>
        <p class="panel-header-subtitle">
          PilgrimOS orchestrates official darshan slots, verified transport, sacred stays, and footfall predictions in one plan.
        </p>
      </div>

      <!-- Rapid Demo Presets -->
      <div class="presets-bar">
        <span style="font-size: 0.78rem; font-weight: 700; color: var(--saffron-500);">⚡ DEMO PRESETS:</span>
        <button type="button" class="preset-chip" data-preset="varanasi">Delhi → Varanasi (Kashi)</button>
        <button type="button" class="preset-chip" data-preset="tirupati">Bengaluru → Tirupati Balaji</button>
        <button type="button" class="preset-chip" data-preset="vaishnodevi">Delhi → Vaishno Devi</button>
        <button type="button" class="preset-chip" data-preset="shirdi">Mumbai → Shirdi Sai Baba</button>
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
              class="form-input ${errors.originCity ? 'error' : ''}"
              placeholder="e.g. New Delhi, Bengaluru, Mumbai"
              value="${origin}"
              required
            />
            ${errors.originCity ? `<div class="form-error">${errors.originCity}</div>` : ''}
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
              class="form-select ${errors.destinationTemple ? 'error' : ''}"
              required
            >
              <option value="Varanasi (Kashi Vishwanath Jyotirlinga)" ${destination.includes('Varanasi') ? 'selected' : ''}>
                Varanasi (Kashi Vishwanath Jyotirlinga, UP)
              </option>
              <option value="Tirupati (Sri Venkateswara Swami, Tirumala)" ${destination.includes('Tirupati') ? 'selected' : ''}>
                Tirupati (Sri Venkateswara Swami, AP)
              </option>
              <option value="Vaishno Devi (Mata Vaishno Devi Shrine, Katra)" ${destination.includes('Vaishno') ? 'selected' : ''}>
                Vaishno Devi (Mata Vaishno Devi Shrine, J&K)
              </option>
              <option value="Shirdi (Sai Baba Sansthan)" ${destination.includes('Shirdi') ? 'selected' : ''}>
                Shirdi (Sai Baba Sansthan, Maharashtra)
              </option>
              <option value="Sabarimala (Lord Ayyappa Temple)" ${destination.includes('Sabarimala') ? 'selected' : ''}>
                Sabarimala (Lord Ayyappa Temple, Kerala)
              </option>
            </select>
            ${errors.destinationTemple ? `<div class="form-error">${errors.destinationTemple}</div>` : ''}
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
              class="form-input ${errors.startDate ? 'error' : ''}"
              value="${startDate}"
              required
            />
            ${errors.startDate ? `<div class="form-error">${errors.startDate}</div>` : ''}
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
              class="form-input ${errors.endDate ? 'error' : ''}"
              value="${endDate}"
              required
            />
            ${errors.endDate ? `<div class="form-error">${errors.endDate}</div>` : ''}
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
              class="form-input ${errors.travelers ? 'error' : ''}"
              value="${travelers}"
              required
            />
            ${errors.travelers ? `<div class="form-error">${errors.travelers}</div>` : ''}
          </div>

          <!-- Budget Tier -->
          <div class="form-group">
            <label class="form-label" for="budgetTier">Budget Preference</label>
            <select id="budgetTier" name="budgetTier" class="form-select">
              <option value="budget" ${budget === 'budget' ? 'selected' : ''}>Economy / Dharamshala</option>
              <option value="standard" ${budget === 'standard' ? 'selected' : ''}>Standard / Temple Trust Suite</option>
              <option value="premium" ${budget === 'premium' ? 'selected' : ''}>Premium / Direct Corridor VIP</option>
            </select>
          </div>

          <!-- Special Constraints & Preferences -->
          <div class="form-group full-width" style="margin-top: 0.5rem;">
            <label class="form-label">Ritual Preferences & Special Assistance</label>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem; margin-top: 0.35rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer; color: var(--text-secondary);">
                <input type="checkbox" id="seniorCitizenDarshan" name="seniorCitizenDarshan" ${senior ? 'checked' : ''} />
                Senior Citizen Priority Darshan
              </label>

              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer; color: var(--text-secondary);">
                <input type="checkbox" id="wheelchairAccess" name="wheelchairAccess" ${wheelchair ? 'checked' : ''} />
                Wheelchair / Ramp Access
              </label>

              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer; color: var(--text-secondary);">
                <input type="checkbox" id="fastingOrSatvikFood" name="fastingOrSatvikFood" ${satvik ? 'checked' : ''} />
                Satvik / Pure Vegetarian Meals
              </label>

              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer; color: var(--text-secondary);">
                <input type="checkbox" id="nearbyAlternativeTemplesOk" name="nearbyAlternativeTemplesOk" ${alternatives ? 'checked' : ''} />
                Recommend Nearby Shaktipeeths/Temples
              </label>
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-subtle);">
          <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--text-muted);">
            <span>🛡️</span>
            <span>Zero payment or booking is made without explicit approval on the next screen.</span>
          </div>
          <button type="submit" class="btn btn-primary" id="btn-start-planning" ${isSubmitting ? 'disabled' : ''}>
            ${isSubmitting ? 'Initializing Agent...' : 'Launch Autonomous Agent ➔'}
          </button>
        </div>
      </form>
    </div>
  `;
}
