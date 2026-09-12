/* ==========================================================================
   PILGRIMOS LIVE AGENT EXECUTION STATUS COMPONENT
   Visualizes progressive autonomous research stages, live logs, and radar
   ========================================================================== */

import type { AgentStatus } from '../types/index.js';

export function renderLiveStatus(status: AgentStatus): string {
  const stages = [
    { key: 'requirements', label: 'Understanding requirements & constraints', threshold: 10 },
    { key: 'transport', label: 'Searching transport (High-speed Rail / Flights)', threshold: 30 },
    { key: 'stay', label: 'Scanning accommodation & Temple Trust Dharamshalas', threshold: 50 },
    { key: 'darshan', label: 'Checking official Darshan slot availability & quotas', threshold: 70 },
    { key: 'crowd', label: 'Forecasting crowd footfall & queue wait times', threshold: 85 },
    { key: 'itinerary', label: 'Synthesizing journey plan & nearby alternatives', threshold: 90 },
  ];

  return `
    <div class="glass-panel fade-in live-status-container">
      <div class="panel-header">
        <h2 class="panel-header-title">
          <span>⚡</span> Autonomous Agent Active
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
        ${stages
          .map((stage) => {
            const isCompleted = status.progressPercent > stage.threshold;
            const isInProgress =
              status.progressPercent >= stage.threshold - 15 && status.progressPercent <= stage.threshold;

            let statusClass = 'pending';
            let icon = '○';

            if (isCompleted) {
              statusClass = 'completed';
              icon = '✓';
            } else if (isInProgress) {
              statusClass = 'in-progress';
              icon = '●';
            }

            return `
              <div class="check-item ${statusClass}">
                <div class="check-title-group">
                  <div class="check-icon">${icon}</div>
                  <span style="font-size: 0.9rem; font-weight: 500;">${stage.label}</span>
                </div>
                <div style="font-size: 0.78rem; font-weight: 600; text-transform: uppercase; color: ${
                  isCompleted ? 'var(--emerald-400)' : isInProgress ? 'var(--saffron-500)' : 'var(--text-muted)'
                };">
                  ${isCompleted ? 'Verified' : isInProgress ? 'Scanning...' : 'Pending'}
                </div>
              </div>
            `;
          })
          .join('')}
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
          ${status.logs
            .map(
              (log) => `
              <div class="terminal-line">
                <span class="terminal-time">[${escapeHtml(log.timestamp)}]</span>
                <span class="terminal-text ${log.level}">➔ ${escapeHtml(log.message)}</span>
              </div>
            `
            )
            .join('')}
        </div>
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
