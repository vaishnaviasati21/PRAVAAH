import crypto from "crypto";

const sessions = new Map();

export const SESSION_STATUS = {
    IDLE: "idle",
    STARTING: "starting",
    SEARCHING: "searching",
    PLANNING: "planning",
    RETRYING: "retrying",
    RESULT_READY: "result_ready",
    APPROVAL_REQUIRED: "approval_required",
    COMPLETED: "completed",
    FAILED: "failed",
};

export function createSession(request) {
    const sessionId = `session_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const session = {
        success: true,
        session_id: sessionId,
        status: SESSION_STATUS.STARTING,
        current_step: "Creating pilgrimage session",
        progress: 0,
        request: {
            origin: request.origin,
            destination: request.destination,
            date: request.date,
            pilgrims: request.pilgrims,
        },
        results: {
            temple: null,
            travel: null,
            hotel: null,
        },
        partial_results: false,
        approval: null,
        error: null,
        created_at: now,
        updated_at: now,
    };

    sessions.set(sessionId, session);
    console.log(`[SessionService] Created ${sessionId}`);
    return session;
}

export function getSession(sessionId) {
    return sessions.get(sessionId) || null;
}

export function updateSession(sessionId, updates) {
    const session = sessions.get(sessionId);
    if (!session) {
        return null;
    }
    const updatedSession = {
        ...session,
        ...updates,
        updated_at: new Date().toISOString(),
    };
    sessions.set(sessionId, updatedSession);
    return updatedSession;
}

export function updateProgress(sessionId, status, currentStep, progress) {
    return updateSession(sessionId, {
        status,
        current_step: currentStep,
        progress,
    });
}

export function updateResults(sessionId, results) {
    const session = getSession(sessionId);
    if (!session) {
        return null;
    }
    return updateSession(sessionId, {
        results: {
            ...session.results,
            ...results,
        },
    });
}

export function setError(sessionId, error) {
    return updateSession(sessionId, {
        success: false,
        status: SESSION_STATUS.FAILED,
        error,
    });
}

export function requireApproval(sessionId, approval) {
    return updateSession(sessionId, {
        status: SESSION_STATUS.APPROVAL_REQUIRED,
        current_step: "Awaiting human approval",
        approval,
    });
}