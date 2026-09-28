import "server-only";
import { get, run } from "./db";

/** Fixed-window counter stored in SQLite. Returns false when the limit is exceeded. */
export function hit(key: string, limit: number, windowMs: number) {
  const t = Date.now();
  const row = get<{ count: number; window_start: number }>("SELECT count, window_start FROM rate_limits WHERE key = ?", key);
  if (!row || t - row.window_start > windowMs) {
    run("INSERT OR REPLACE INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)", key, t);
    return true;
  }
  if (row.count >= limit) return false;
  run("UPDATE rate_limits SET count = count + 1 WHERE key = ?", key);
  return true;
}

export function isBlocked(key: string, limit: number, windowMs: number) {
  const row = get<{ count: number; window_start: number }>("SELECT count, window_start FROM rate_limits WHERE key = ?", key);
  return !!row && Date.now() - row.window_start <= windowMs && row.count >= limit;
}

export function reset(key: string) {
  run("DELETE FROM rate_limits WHERE key = ?", key);
}
