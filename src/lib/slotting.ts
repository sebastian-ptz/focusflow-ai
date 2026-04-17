// Pure slotting helper — no I/O.
// Spread N steps across a day between START_HOUR and END_HOUR, with a fixed
// per-step duration. If they don't all fit, pack back-to-back from START_HOUR
// and return only the slots that fit (caller decides what to do with overflow).

export interface SlotOptions {
  startHour?: number; // inclusive, e.g. 9
  endHour?: number; // exclusive, e.g. 17
  stepMinutes?: number; // e.g. 15
}

const DEFAULTS: Required<SlotOptions> = {
  startHour: 9,
  endHour: 17,
  stepMinutes: 15,
};

/**
 * Build evenly-spaced timestamps for `count` steps on the given local date.
 * - If steps fit with even spacing inside the window, spread them.
 * - Otherwise pack from startHour at stepMinutes intervals; cap at window end.
 */
export function slotSteps(
  dateYmd: string, // "YYYY-MM-DD" local
  count: number,
  opts: SlotOptions = {},
): Date[] {
  const { startHour, endHour, stepMinutes } = { ...DEFAULTS, ...opts };
  if (count <= 0) return [];

  const [y, m, d] = dateYmd.split("-").map(Number);
  const windowMinutes = (endHour - startHour) * 60;
  const maxThatFit = Math.floor(windowMinutes / stepMinutes);

  const out: Date[] = [];

  if (count === 1) {
    out.push(new Date(y, m - 1, d, startHour, 0, 0, 0));
    return out;
  }

  if (count <= maxThatFit) {
    // Even spread: divide window into (count-1) gaps, but snap to stepMinutes.
    const gap = Math.max(stepMinutes, Math.floor(windowMinutes / count));
    for (let i = 0; i < count; i++) {
      const minutesFromStart = Math.min(i * gap, windowMinutes - stepMinutes);
      const totalMin = startHour * 60 + minutesFromStart;
      const hh = Math.floor(totalMin / 60);
      const mm = totalMin % 60;
      out.push(new Date(y, m - 1, d, hh, mm, 0, 0));
    }
    return out;
  }

  // Overflow: pack back-to-back; cap at the number that fit.
  for (let i = 0; i < maxThatFit; i++) {
    const totalMin = startHour * 60 + i * stepMinutes;
    const hh = Math.floor(totalMin / 60);
    const mm = totalMin % 60;
    out.push(new Date(y, m - 1, d, hh, mm, 0, 0));
  }
  return out;
}

export function formatSlot(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
