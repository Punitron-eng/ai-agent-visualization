import fs from "node:fs";

/**
 * Tails one append-only JSONL file from its current end.
 *
 * fs.watch alone is not dependable on Windows for a file being appended to by
 * another process, so a stat poll backs it up. Both funnel into the same
 * offset-based drain, which is idempotent.
 */

export interface TailHandle {
  close(): void;
  readonly path: string;
}

export interface TailOptions {
  /** Start at byte 0 instead of the current end. */
  fromStart?: boolean;
  pollMs?: number;
  onLine(line: string): void;
  onError?(error: unknown): void;
}

export function tailFile(filePath: string, options: TailOptions): TailHandle {
  const pollMs = options.pollMs ?? 250;
  let position = 0;
  let buffer = "";
  let closed = false;
  let draining = false;

  try {
    position = options.fromStart ? 0 : fs.statSync(filePath).size;
  } catch (error) {
    options.onError?.(error);
  }

  const drain = (): void => {
    if (closed || draining) return;
    draining = true;
    try {
      const { size } = fs.statSync(filePath);

      // Truncated or rotated: start over rather than emitting garbage.
      if (size < position) {
        position = 0;
        buffer = "";
      }
      if (size === position) return;

      const length = size - position;
      const chunk = Buffer.alloc(length);
      const fd = fs.openSync(filePath, "r");
      try {
        fs.readSync(fd, chunk, 0, length, position);
      } finally {
        fs.closeSync(fd);
      }
      position = size;

      buffer += chunk.toString("utf8");
      const lines = buffer.split("\n");
      // The final element is either "" or a partial line still being written.
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.trim().length === 0) continue;
        try {
          options.onLine(line);
        } catch (error) {
          options.onError?.(error);
        }
      }
    } catch (error) {
      options.onError?.(error);
    } finally {
      draining = false;
    }
  };

  let watcher: fs.FSWatcher | null = null;
  try {
    watcher = fs.watch(filePath, { persistent: false }, () => drain());
    watcher.on("error", (error) => options.onError?.(error));
  } catch (error) {
    options.onError?.(error);
  }

  const poll = setInterval(drain, pollMs);
  poll.unref?.();

  if (options.fromStart) drain();

  return {
    path: filePath,
    close(): void {
      if (closed) return;
      closed = true;
      clearInterval(poll);
      watcher?.close();
      watcher = null;
    },
  };
}
