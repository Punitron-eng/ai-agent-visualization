import { getBridge } from "@/lib/bridge/bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One-shot snapshot. Doubles as the health check the hook installer uses. */
export async function GET(): Promise<Response> {
  const bridge = getBridge();
  return Response.json({
    ok: true,
    serverStartedAt: bridge.startedAt,
    activeTails: bridge.watcher.activeTailCount,
    stats: bridge.stats,
    projects: bridge.snapshot(),
  });
}
