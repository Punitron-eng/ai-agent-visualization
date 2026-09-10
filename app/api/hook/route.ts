import { getBridge } from "@/lib/bridge/bus";
import { makeDebugEvent, normalizeHookEvent } from "@/lib/bridge/normalizeEvent";
import { AGENT_STATES, type AgentState } from "@/lib/agent/agentTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Receives Claude Code `type: "http"` hooks, and the debug panel's synthetic
 * events, which travel this same path on purpose so the buttons exercise the
 * real pipeline instead of bypassing it.
 *
 * Contract with Claude Code: always answer 204 with an empty body, never a
 * decision object. A visualizer must not be able to influence a session, and
 * combined with `async: true` in the hook config it cannot delay one either.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const raw: unknown = await request.json();
    const bridge = getBridge();

    if (isDebugPayload(raw)) {
      bridge.ingest(makeDebugEvent(raw.projectPath, raw.state));
      return new Response(null, { status: 204 });
    }

    const { event, reason } = normalizeHookEvent(raw);
    if (!event) {
      console.warn("[companion] dropped hook payload:", reason);
      return new Response(null, { status: 204 });
    }
    bridge.ingest(event);
  } catch (error) {
    // Malformed JSON, an unexpected shape, anything: swallow it. Returning 500
    // to Claude Code would put noise in the user's session for no benefit.
    console.warn("[companion] hook error:", error);
  }
  return new Response(null, { status: 204 });
}

interface DebugPayload {
  __debug: true;
  projectPath: string;
  state: AgentState;
}

function isDebugPayload(value: unknown): value is DebugPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.__debug === true &&
    typeof candidate.projectPath === "string" &&
    typeof candidate.state === "string" &&
    (AGENT_STATES as readonly string[]).includes(candidate.state)
  );
}
