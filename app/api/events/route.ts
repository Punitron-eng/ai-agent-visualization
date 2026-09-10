import { getBridge } from "@/lib/bridge/bus";
import type { BridgeMessage } from "@/lib/agent/agentTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEEPALIVE_MS = 15_000;

/**
 * SSE stream. The server holds authoritative per-project state, so a refresh or
 * a second tab gets a full snapshot immediately rather than an empty grid.
 */
export async function GET(request: Request): Promise<Response> {
  const bridge = getBridge();
  const encoder = new TextEncoder();

  let unsubscribe: (() => void) | null = null;
  let keepalive: NodeJS.Timeout | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const send = (message: BridgeMessage): void => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
        } catch {
          cleanup();
        }
      };

      const cleanup = (): void => {
        if (closed) return;
        closed = true;
        unsubscribe?.();
        unsubscribe = null;
        if (keepalive) clearInterval(keepalive);
        keepalive = null;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      send({ type: "snapshot", projects: bridge.snapshot(), serverStartedAt: bridge.startedAt });
      unsubscribe = bridge.subscribe(send);

      keepalive = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          cleanup();
        }
      }, KEEPALIVE_MS);
      keepalive.unref?.();

      // The only reliable teardown signal for a long-lived route handler.
      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      unsubscribe?.();
      if (keepalive) clearInterval(keepalive);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
