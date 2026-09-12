/* ==========================================================================
   PILGRIMOS JOURNEY PLAN & AVAILABILITY RESULTS COMPONENT
   Renders compiled itinerary, transport/stay availability, crowd density,
   and nearby alternative temples.
   ========================================================================== */

import type { JourneyPlan, AvailabilityResult } from '../types/index.js';

export function renderJourneyPlan(plan: JourneyPlan, availability?: AvailabilityResult | null): string {
  return `
    <div class="glass-panel fade-in" style="margin-bottom: 2rem;">
      <div class="panel-header">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 700; color: var(--saffron-500); text-transform: uppercase; margin-bottom: 0.25rem;">
              <span>🚩</span> Verified Autonomous Itinerary
            </div>
            <h2 class="panel-header-title">${escapeHtml(plan.title)}</h2>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Estimated Total Cost</div>
            <div style="font-size: 1.8rem; font-weight: 800; font-family: var(--font-display); color: var(--gold-500);">
              ₹${plan.totalEstimatedCostInr.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      <!-- Hero Metrics Bar -->
      <div class="journey-summary-hero">
        <div class="metric-card">
          <span class="metric-title">Primary Transport</span>
          <span class="metric-value" style="font-size: 1.05rem;">${escapeHtml(plan.recommendedTransport.provider)}</span>
          <span style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(plan.recommendedTransport.departureTime)}</span>
        </div>
        <div class="metric-card">
          <span class="metric-title">Temple Accommodation</span>
          <span class="metric-value" style="font-size: 1.05rem;">${escapeHtml(plan.recommendedAccommodation.name)}</span>
          <span style="font-size: 0.78rem; color: var(--emerald-400);">
            ⭐ ${plan.recommendedAccommodation.rating} (${plan.recommendedAccommodation.distanceFromTempleKm} km to Sanctum)
          </span>
        </div>
        <div class="metric-card">
          <span class="metric-title">Peak Queue Expectation</span>
          <span class="metric-value highlight" style="font-size: 1.05rem;">
            ~${plan.crowdForecasts[0]?.expectedWaitHours ?? 1} Hours Wait
          </span>
          <span style="font-size: 0.78rem; color: var(--text-muted);">
            Crowd Level: ${plan.crowdForecasts[0]?.crowdLevel.toUpperCase() ?? 'MODERATE'}
          </span>
        </div>
      </div>

      <!-- Day-by-Day Sacred Itinerary -->
      <h3 style="font-size: 1.15rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
        <span>🗓️</span> Day-by-Day Spiritual Schedule
      </h3>
      <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
        ${plan.itinerary
          .map(
            (day) => `
            <div class="itinerary-day-card">
              <div class="day-header">
                <span class="day-tag">Day ${day.day} • ${escapeHtml(day.date)}</span>
                <span style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">${escapeHtml(day.title)}</span>
              </div>
              <div class="day-events-list">
                ${day.activities
                  .map(
                    (act) => `
                    <div class="event-row">
                      <div class="event-time">${escapeHtml(act.time)}</div>
                      <div class="event-details">
                        <div class="event-title">
                          ${act.isDarshan ? '<span style="color: var(--gold-500); margin-right: 0.3rem;">⚜️ [DARSHAN]</span>' : ''}
                          ${escapeHtml(act.title)}
                        </div>
                        <div class="event-desc">${escapeHtml(act.description)}</div>
                      </div>
                    </div>
                  `
                  )
                  .join('')}
              </div>
            </div>
          `
          )
          .join('')}
      </div>

      <!-- Live Availability & Crowd Forecast -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        <!-- Crowd Density by Date -->
        <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: var(--radius-lg); border: 1px solid var(--border-subtle);">
          <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>👥</span> Crowd Density Forecast
          </h4>
          <div style="display: flex; flex-direction: column; gap: 0.6rem;">
            ${plan.crowdForecasts
              .map(
                (cf) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm);">
                  <div>
                    <div style="font-size: 0.82rem; font-weight: 600;">${escapeHtml(cf.date)}</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">Darshan Slots Remaining: ${cf.darshanSlotsRemaining}</div>
                  </div>
                  <div class="crowd-day crowd-${cf.crowdLevel === 'low' ? 'low' : cf.crowdLevel === 'moderate' ? 'moderate' : 'high'}" style="flex: 0 0 90px;">
                    ${cf.crowdLevel.toUpperCase()}
                  </div>
                </div>
              `
              )
              .join('')}
          </div>
        </div>

        <!-- Official Darshan Slots -->
        <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: var(--radius-lg); border: 1px solid var(--border-subtle);">
          <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>🎟️</span> Available Darshan Passes
          </h4>
          <div style="display: flex; flex-direction: column; gap: 0.6rem;">
            ${(availability?.darshanSlots[0]?.slots ?? [
              { slotTime: '06:30 AM - 07:30 AM', quotaType: 'Special Entry Pass', availableCount: 18 },
              { slotTime: '04:30 PM - 05:30 PM', quotaType: 'Sugam Darshan', availableCount: 26 },
            ])
              .map(
                (slot) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm);">
                  <div>
                    <div style="font-size: 0.82rem; font-weight: 600; color: var(--saffron-500);">${escapeHtml(slot.slotTime)}</div>
                    <div style="font-size: 0.72rem; color: var(--text-secondary);">${escapeHtml(slot.quotaType)}</div>
                  </div>
                  <div style="font-size: 0.78rem; font-weight: 700; color: var(--emerald-400);">
                    ${slot.availableCount} Seats
                  </div>
                </div>
              `
              )
              .join('')}
          </div>
        </div>
      </div>

      <!-- Nearby Alternative Temples -->
      ${
        plan.nearbyAlternatives && plan.nearbyAlternatives.length > 0
          ? `
        <div style="margin-bottom: 2rem;">
          <h3 style="font-size: 1.15rem; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>🛕</span> Recommended Nearby Alternative Temples & Parikrama
          </h3>
          <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 1rem;">
            Suggested if primary sanctum queue spikes or to complete traditional regional parikrama.
          </p>
          <div class="availability-grid">
            ${plan.nearbyAlternatives
              .map(
                (alt) => `
                <div class="option-card">
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                      <h4 style="font-size: 0.95rem; font-weight: 700;">${escapeHtml(alt.name)}</h4>
                      <span style="font-size: 0.7rem; padding: 0.2rem 0.5rem; background: rgba(16, 185, 129, 0.15); color: var(--emerald-400); border-radius: var(--radius-full);">
                        ${escapeHtml(alt.travelTime)}
                      </span>
                    </div>
                    <div style="font-size: 0.78rem; color: var(--saffron-500); margin-bottom: 0.4rem;">
                      Deity: ${escapeHtml(alt.keyDeity)}
                    </div>
                    <p style="font-size: 0.8rem; color: var(--text-secondary);">
                      ${escapeHtml(alt.reason)}
                    </p>
                  </div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); border-top: 1px solid var(--border-subtle); padding-top: 0.5rem;">
                    Distance: ${alt.distanceKm} km from primary temple
                  </div>
                </div>
              `
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }

      <!-- Sacred Etiquette Notes -->
      <div style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: var(--radius-md); padding: 1rem 1.25rem;">
        <div style="font-size: 0.82rem; font-weight: 700; color: var(--saffron-500); margin-bottom: 0.4rem;">
          📌 Official Temple Trust Guidelines & Requirements:
        </div>
        <ul style="padding-left: 1.25rem; font-size: 0.8rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.3rem;">
          ${plan.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}
        </ul>
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
