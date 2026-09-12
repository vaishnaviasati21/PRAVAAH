import {
    SESSION_STATUS,
    getSession,
    updateProgress,
    updateResults,
    setError,
} from "../services/session-service.js";
import {
    checkTempleAvailability,
} from "../adapters/adapter-client.js";

import {
    executeWithRecovery,
} from "../services/recovery-service.js";

import {
    requestHumanApproval,
} from "../hitl/approval-service.js";


function wait(milliseconds) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

export async function runPilgrimOrchestrator(sessionId) {
    console.log(`[Orchestrator] Starting session ${sessionId}`);

    try {
        const session = getSession(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        // STEP 1: Understand request
        updateProgress(
            sessionId,
            SESSION_STATUS.STARTING,
            "Understanding your pilgrimage request",
            10
        );

        await wait(500);

        // STEP 2: Search temple
        updateProgress(
            sessionId,
            SESSION_STATUS.SEARCHING,
            "Checking temple availability",
            25
        );

        // STEP 3: Call adapter
        const templeResult = await executeWithRecovery({
            operationName: "Temple availability search",

            operation: () =>
                checkTempleAvailability(session.request),

            maxRetries: 3,

            retryDelayMs: 500,

            onRetry: async ({ attempt, maxRetries }) => {
                updateProgress(
                    sessionId,
                    SESSION_STATUS.RETRYING,
                    `Retrying temple search (${attempt}/${maxRetries})`,
                    30
                );
            },
        });

        // STEP 4: Handle adapter failure
        if (!templeResult.success) {
            updateResults(sessionId, {
                temple: templeResult,
            });

            setError(sessionId, {
                code:
                    templeResult.error?.code ||
                    "TEMPLE_SEARCH_FAILED",
                message:
                    templeResult.error?.message ||
                    "Temple availability search failed.",
            });

            return;
        }

        // STEP 5: Save temple result
        updateResults(sessionId, {
            temple: templeResult.data,
        });

        // STEP 6: Analyze result
        updateProgress(
            sessionId,
            SESSION_STATUS.PLANNING,
            "Analyzing darshan availability",
            60
        );

        await wait(700);

        // STEP 7: Build plan
        updateProgress(
            sessionId,
            SESSION_STATUS.PLANNING,
            "Building your pilgrimage plan",
            85
        );

        await wait(500);

        // STEP 8: Finish
        updateProgress(
            sessionId,
            SESSION_STATUS.RESULT_READY,
            "Pilgrimage plan ready",
            100
        );

        requestHumanApproval(sessionId, {
            action: "review_and_continue",
            description:
                "Pilgrimage plan is ready. Review the available options before any booking action.",
            provider: "PilgrimOS",
            amount: null,
        });

        console.log(
            `[Orchestrator] Session ${sessionId} completed`
        );
    } catch (error) {
        console.error(
            `[Orchestrator] Error in ${sessionId}:`,
            error
        );

        setError(sessionId, {
            code: "ORCHESTRATOR_ERROR",
            message:
                error.message ||
                "Unexpected orchestration error.",
        });
    }
}