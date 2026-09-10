"use client";

import { useEffect, useState } from "react";
import type { BridgeMessage } from "@/lib/agent/agentTypes";
import { useAgentStore } from "@/store/agentStore";

const RETRY_BASE_MS = 500;
const RETRY_MAX_MS = 10_000;

/**
 * Owns the single SSE connection. EventSource reconnects on its own for network
 * blips, but not when the server closes the stream deliberately (a dev-server
 * restart), so failures are retried here with capped backoff.
 */
export function useAgentStream(): void {
  const apply = useAgentStore((s) => s.apply);
  const setConnected = useAgentStore((s) => s.setConnected);

  useEffect(() => {
    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let disposed = false;

    const connect = (): void => {
      if (disposed) return;
      source = new EventSource("/api/events");

      source.onopen = () => {
        attempt = 0;
        setConnected(true);
      };

      source.onmessage = (raw) => {
        try {
          apply(JSON.parse(raw.data) as BridgeMessage);
        } catch {
          // A truncated frame is not worth tearing the connection down for.
        }
      };

      source.onerror = () => {
        setConnected(false);
        source?.close();
        source = null;
        if (disposed) return;
        const delay = Math.min(RETRY_BASE_MS * 2 ** attempt, RETRY_MAX_MS);
        attempt += 1;
        retryTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      source?.close();
      setConnected(false);
    };
  }, [apply, setConnected]);
}

/** True while the tab is visible; expensive loops pause when it is not. */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return visible;
}
