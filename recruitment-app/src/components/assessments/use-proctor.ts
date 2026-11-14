"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LOCKDOWN_MAX_VIOLATIONS,
  type IntegrityEvent,
  type IntegrityEventType,
  type ProctoringMode,
} from "@/lib/assessments";

export type AwayReason = "tab_hidden" | "fullscreen_exit" | null;

function isFullscreen() {
  return typeof document !== "undefined" && Boolean(document.fullscreenElement);
}

export function fullscreenSupported() {
  return typeof document !== "undefined" && Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen);
}

export async function enterFullscreen(): Promise<boolean> {
  if (!fullscreenSupported()) return false;
  try {
    await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    return true;
  } catch {
    return false;
  }
}

export async function leaveFullscreen() {
  try {
    if (isFullscreen()) await document.exitFullscreen();
  } catch {
    // Already out of fullscreen.
  }
}

function devtoolsShortcut(event: KeyboardEvent) {
  const key = event.key.toLowerCase();
  if (event.key === "F12") return true;
  const mod = event.ctrlKey || event.metaKey;
  if (mod && event.shiftKey && (key === "i" || key === "j" || key === "c")) return true;
  if (event.metaKey && event.altKey && (key === "i" || key === "j" || key === "c")) return true;
  if (mod && key === "u") return true;
  return false;
}

/**
 * Browser-event proctoring for one sitting.
 *
 * PROCTORED logs tab switches, focus loss and paste attempts and never blocks.
 * LOCKDOWN also requires fullscreen, blocks copy/cut/paste/drop and the context
 * menu, and treats each time the candidate leaves the tab or fullscreen as one
 * violation. The caller submits at LOCKDOWN_MAX_VIOLATIONS.
 *
 * This is a deterrent and a record for a human reviewer, not a secure exam
 * browser. It cannot see a second device and it never uses the camera.
 */
export function useProctor({
  mode,
  active,
  startedAtMs,
  onViolationLimit,
}: {
  mode: ProctoringMode;
  active: boolean;
  startedAtMs: number;
  onViolationLimit: () => void;
}) {
  const eventsRef = useRef<IntegrityEvent[]>([]);
  const [events, setEvents] = useState<IntegrityEvent[]>([]);
  const [violations, setViolations] = useState(0);
  const [away, setAway] = useState<AwayReason>(null);
  const awayRef = useRef<AwayReason>(null);
  const limitFired = useRef(false);
  const lastLogged = useRef<Partial<Record<IntegrityEventType, number>>>({});

  const log = useCallback(
    (type: IntegrityEventType) => {
      const now = Date.now();
      // Some browsers fire the same signal twice in a row; one is enough.
      const previous = lastLogged.current[type];
      if (previous && now - previous < 800) return;
      lastLogged.current[type] = now;
      const entry = { type, atSeconds: Math.max(0, Math.round((now - startedAtMs) / 1000)) };
      eventsRef.current = [...eventsRef.current, entry].slice(-500);
      setEvents(eventsRef.current);
    },
    [startedAtMs],
  );

  const markAway = useCallback(
    (reason: Exclude<AwayReason, null>) => {
      if (awayRef.current) return;
      log(reason);
      if (mode !== "LOCKDOWN") return;
      awayRef.current = reason;
      setAway(reason);
      setViolations((count) => {
        const next = count + 1;
        if (next >= LOCKDOWN_MAX_VIOLATIONS && !limitFired.current) {
          limitFired.current = true;
          // Defer so React finishes this update before the submission starts.
          window.setTimeout(onViolationLimit, 0);
        }
        return next;
      });
    },
    [log, mode, onViolationLimit],
  );

  const returnToTest = useCallback(async () => {
    if (mode === "LOCKDOWN" && fullscreenSupported() && !isFullscreen()) {
      const ok = await enterFullscreen();
      if (!ok) return false;
    }
    awayRef.current = null;
    setAway(null);
    return true;
  }, [mode]);

  useEffect(() => {
    if (!active || mode === "NONE") return;

    function onVisibility() {
      if (document.visibilityState === "hidden") markAway("tab_hidden");
    }
    function onBlur() {
      // A hidden tab is already logged as tab_hidden.
      if (document.visibilityState === "hidden") return;
      log("window_blur");
    }
    function onFullscreenChange() {
      if (mode === "LOCKDOWN" && !isFullscreen()) markAway("fullscreen_exit");
    }
    function onClipboard(event: ClipboardEvent) {
      if (event.type === "paste") log("paste_blocked");
      else if (mode === "LOCKDOWN") log("copy_blocked");
      if (mode === "LOCKDOWN") {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    function onDrop(event: DragEvent) {
      if (mode !== "LOCKDOWN") return;
      event.preventDefault();
      event.stopPropagation();
      log("paste_blocked");
    }
    function onContextMenu(event: MouseEvent) {
      if (mode !== "LOCKDOWN") return;
      event.preventDefault();
      log("context_menu");
    }
    function onKeyDown(event: KeyboardEvent) {
      if (!devtoolsShortcut(event)) return;
      log("devtools_key");
      if (mode === "LOCKDOWN") {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    // Capture phase so the editor never receives a blocked paste.
    window.addEventListener("paste", onClipboard, true);
    window.addEventListener("copy", onClipboard, true);
    window.addEventListener("cut", onClipboard, true);
    window.addEventListener("drop", onDrop, true);
    window.addEventListener("contextmenu", onContextMenu, true);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("paste", onClipboard, true);
      window.removeEventListener("copy", onClipboard, true);
      window.removeEventListener("cut", onClipboard, true);
      window.removeEventListener("drop", onDrop, true);
      window.removeEventListener("contextmenu", onContextMenu, true);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [active, log, markAway, mode]);

  const snapshot = useCallback(() => eventsRef.current.slice(), []);

  return { events, violations, away, returnToTest, snapshot };
}

/** Countdown against the server clock. Returns null for an untimed sitting. */
export function useCountdown({
  durationMinutes,
  startedAtMs,
  skewMs,
  active,
  onExpire,
}: {
  durationMinutes: number;
  startedAtMs: number;
  skewMs: number;
  active: boolean;
  onExpire: () => void;
}) {
  const deadline = durationMinutes > 0 ? startedAtMs + durationMinutes * 60_000 : null;
  const compute = useCallback(
    () => (deadline === null ? null : Math.max(0, Math.round((deadline - (Date.now() + skewMs)) / 1000))),
    [deadline, skewMs],
  );
  const [remaining, setRemaining] = useState<number | null>(compute);
  const fired = useRef(false);

  useEffect(() => {
    if (deadline === null || !active) return;
    const tick = () => {
      const next = compute();
      setRemaining(next);
      if (next === 0 && !fired.current) {
        fired.current = true;
        onExpire();
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [active, compute, deadline, onExpire]);

  return remaining;
}

export function formatClock(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? hours + ":" + pad(minutes) + ":" + pad(secs) : pad(minutes) + ":" + pad(secs);
}
