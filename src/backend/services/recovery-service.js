function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeWithRecovery({
    operation,
    operationName = "operation",
    maxRetries = 3,
    retryDelayMs = 500,
    onRetry,
}) {
    let lastResult = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(
                `[Recovery] ${operationName} attempt ${attempt}/${maxRetries}`
            );

            const result = await operation();

            if (result?.success) {
                return {
                    ...result,
                    recovery: {
                        attempts: attempt,
                        recovered: attempt > 1,
                    },
                };
            }

            lastResult = result;
        } catch (error) {
            lastResult = {
                success: false,
                error: {
                    code: "OPERATION_EXCEPTION",
                    message: error.message || "Unexpected operation error.",
                },
            };
        }

        if (attempt < maxRetries) {
            if (typeof onRetry === "function") {
                await onRetry({
                    attempt,
                    maxRetries,
                    lastResult,
                });
            }

            await sleep(retryDelayMs);
        }
    }

    return {
        success: false,
        error: lastResult?.error || {
            code: "MAX_RETRIES_EXCEEDED",
            message: `${operationName} failed after ${maxRetries} attempts.`,
        },
        recovery: {
            attempts: maxRetries,
            recovered: false,
        },
    };
}