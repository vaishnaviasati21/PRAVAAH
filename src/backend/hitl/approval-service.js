import {
    requireApproval,
    updateSession,
    SESSION_STATUS,
} from "../services/session-service.js";

/*
  Human-In-The-Loop Safety Boundary

  PilgrimOS must stop before:
  - payments
  - OTP entry
  - final irreversible submission
*/

export function requestHumanApproval(
    sessionId,
    {
        action,
        description,
        provider = null,
        amount = null,
    }
) {
    console.log(
        `[HITL] Human approval required for: ${action}`
    );

    return requireApproval(sessionId, {
        required: true,
        action,
        description,
        provider,
        amount,
        requested_at: new Date().toISOString(),
    });
}

export function recordHumanDecision(sessionId, approved) {
    if (!approved) {
        return updateSession(sessionId, {
            status: SESSION_STATUS.COMPLETED,
            current_step: "User declined the requested action",
            approval: {
                approved: false,
                decided_at: new Date().toISOString(),
            },
        });
    }

    /*
      IMPORTANT SAFETY BOUNDARY:
      Approval is only recorded.
      No payment is made.
      No OTP is entered.
      No final form is submitted.
    */
    return updateSession(sessionId, {
        status: SESSION_STATUS.APPROVAL_REQUIRED,
        current_step:
            "Human approval recorded. Awaiting manual completion.",
        approval: {
            approved: true,
            decided_at: new Date().toISOString(),
        },
    });
}