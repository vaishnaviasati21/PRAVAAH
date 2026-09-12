import express from "express";
import cors from "cors";
import {
    createSession,
    getSession,
    SESSION_STATUS,
} from "./services/session-service.js";
import {
    runPilgrimOrchestrator,
} from "./orchestrator/pilgrim-orchestrator.js";

import {
    recordHumanDecision,
} from "./hitl/approval-service.js";

const app = express();
const PORT = process.env.PORT || 8000;

/* Middleware */
app.use(cors());
app.use(express.json());

/* Health Check */
app.get("/health", (req, res) => {
    return res.status(200).json({
        success: true,
        service: "PilgrimOS Backend",
        status: "healthy",
    });
});

/* POST /api/pilgrimage */
app.post("/api/pilgrimage", (req, res) => {
    try {
        const { origin, destination, date, pilgrims } = req.body || {};

        if (!origin || typeof origin !== "string" || !origin.trim()) {
            return res.status(400).json({
                success: false,
                status: SESSION_STATUS.FAILED,
                error: {
                    code: "INVALID_INPUT",
                    message: "origin is required and must be a non-empty string.",
                },
            });
        }

        if (!destination || typeof destination !== "string" || !destination.trim()) {
            return res.status(400).json({
                success: false,
                status: SESSION_STATUS.FAILED,
                error: {
                    code: "INVALID_INPUT",
                    message: "destination is required and must be a non-empty string.",
                },
            });
        }

        if (!date || typeof date !== "string" || !date.trim()) {
            return res.status(400).json({
                success: false,
                status: SESSION_STATUS.FAILED,
                error: {
                    code: "INVALID_INPUT",
                    message: "date is required and must be a string.",
                },
            });
        }

        if (!Number.isInteger(pilgrims) || pilgrims <= 0) {
            return res.status(400).json({
                success: false,
                status: SESSION_STATUS.FAILED,
                error: {
                    code: "INVALID_INPUT",
                    message: "pilgrims must be an integer greater than 0.",
                },
            });
        }

        const session = createSession({
            origin: origin.trim(),
            destination: destination.trim(),
            date,
            pilgrims,
        });

        /* Start orchestrator asynchronously in the background */
        runPilgrimOrchestrator(session.session_id);

        return res.status(201).json({
            success: true,
            session_id: session.session_id,
            status: "starting",
            message: "Pilgrimage planning started",
        });
    } catch (error) {
        console.error("[API] Failed to start pilgrimage:", error);
        return res.status(500).json({
            success: false,
            status: SESSION_STATUS.FAILED,
            error: {
                code: "UNKNOWN_ERROR",
                message: "Unable to start pilgrimage planning.",
            },
        });
    }
});

/* GET /api/pilgrimage/:sessionId */
app.get("/api/pilgrimage/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    const session = getSession(sessionId);

    if (!session) {
        return res.status(404).json({
            success: false,
            status: SESSION_STATUS.FAILED,
            error: {
                code: "SESSION_NOT_FOUND",
                message: "Pilgrimage session not found.",
            },
        });
    }

    return res.status(200).json({
        success: session.success,
        session_id: session.session_id,
        status: session.status,
        current_step: session.current_step,
        progress: session.progress,
        results: session.results,
        partial_results: session.partial_results,
        approval: session.approval,
        error: session.error,
    });
});

/* POST /api/pilgrimage/:sessionId/approve */
app.post("/api/pilgrimage/:sessionId/approve", (req, res) => {
    const { sessionId } = req.params;
    const { approved } = req.body;

    const session = getSession(sessionId);

    if (!session) {
        return res.status(404).json({
            success: false,
            status: SESSION_STATUS.FAILED,
            error: {
                code: "SESSION_NOT_FOUND",
                message: "Pilgrimage session not found.",
            },
        });
    }

    if (typeof approved !== "boolean") {
        return res.status(400).json({
            success: false,
            status: SESSION_STATUS.FAILED,
            error: {
                code: "INVALID_INPUT",
                message: "approved must be a boolean value.",
            },
        });
    }

    if (session.status !== SESSION_STATUS.APPROVAL_REQUIRED) {
        return res.status(409).json({
            success: false,
            status: session.status,
            error: {
                code: "APPROVAL_NOT_REQUIRED",
                message: "This session is not currently waiting for human approval.",
            },
        });
    }

    const updatedSession = recordHumanDecision(
        sessionId,
        approved
    );

    return res.status(200).json({
        success: true,
        session_id: updatedSession.session_id,
        status: updatedSession.status,
        current_step: updatedSession.current_step,
        approval: updatedSession.approval,
        message: approved
            ? "Human authorization recorded. No irreversible action was performed."
            : "Human authorization declined. No irreversible action was performed.",
    });
});

/* 404 Handler */
app.use((req, res) => {
    return res.status(404).json({
        success: false,
        error: {
            code: "ROUTE_NOT_FOUND",
            message: "Requested API route was not found.",
        },
    });
});

/* Error Handler */
app.use((error, req, res, next) => {
    console.error("[PilgrimOS] Unhandled server error:", error);
    return res.status(500).json({
        success: false,
        status: SESSION_STATUS.FAILED,
        error: {
            code: "UNKNOWN_ERROR",
            message: "An unexpected server error occurred.",
        },
    });
});

/* Start Server */
app.listen(PORT, () => {
    console.log("==========================================");
    console.log(" PilgrimOS Backend Started");
    console.log("==========================================");
    console.log(` Server: http://localhost:${PORT}`);
    console.log(` Health: http://localhost:${PORT}/health`);
    console.log("==========================================");
});