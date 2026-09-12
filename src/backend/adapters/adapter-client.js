/*
  ============================================================
  PC2 ADAPTER INTERFACE CONTRACT
  ============================================================

  PC2 must export a drop-in replacement for this module at:
    src/backend/adapters/adapter-client.js

  Required export:
    checkTempleAvailability(request) → Promise<AdapterResult>

  Input shape (request):
    {
      origin:      string   // e.g. "Delhi"
      destination: string   // e.g. "Tirupati"
      date:        string   // e.g. "2024-12-25"
      pilgrims:    number   // integer > 0
    }

  Expected return shape (AdapterResult):
    {
      success: boolean,      // true = data available, false = failed
      adapter: string,       // adapter identifier, e.g. "temple"
      status:  string,       // e.g. "completed" | "failed"
      source:  string,       // e.g. "webcmd_live" | "development_mock"
      data: {
        destination:       string,
        available:         boolean,
        recommended_slot:  string,
        crowd_level:       string,
        message:           string,
      } | null,
      error: {
        code:    string,
        message: string,
      } | null,
    }

  Implementation notes for PC2:
    - Use Webcmd browser automation to fetch live temple data.
    - Return success: false with an error object on failure;
      do NOT throw — the orchestrator uses executeWithRecovery
      and expects a result object, not an exception.
    - The mock below is the development placeholder and MUST
      remain intact until PC2's implementation is ready.
  ============================================================
*/

export async function checkTempleAvailability(request) {
    console.log(
        `[AdapterClient] Temple availability requested for ${request.destination}`
    );

    /*
      DEVELOPMENT PLACEHOLDER ONLY.
      This does NOT represent live data.
      It will be replaced with PC 2's real webcmd adapter.
    */
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
        success: true,
        adapter: "temple",
        status: "completed",
        source: "development_mock",
        data: {
            destination: request.destination,
            available: true,
            recommended_slot: "10:30 AM",
            crowd_level: "unknown",
            message:
                "Development adapter result. Replace with live webcmd data.",
        },
        error: null,
    };
}