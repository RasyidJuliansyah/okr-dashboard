export type TargetType = "AT_LEAST" | "AT_MOST" | "EXACT";

/**
 * Calculates progress percentage (0 - 100) based on targetType:
 * - AT_LEAST: higher is better. (current - baseline) / (target - baseline) * 100.
 * - AT_MOST: lower is better (max cap). If current <= target -> 100%. If current > target -> penalty.
 * - EXACT: deviation penalty.
 */
export function calculateProgressPercent(
  current: number,
  target: number,
  targetType: string = "AT_LEAST",
  baseline: number = 0
): number {
  if (target === null || target === undefined || isNaN(target)) return 0;
  const curr = current || 0;
  const tgt = target;
  const base = baseline || 0;
  const type = (targetType || "AT_LEAST").toUpperCase();

  if (type === "AT_MOST") {
    if (tgt <= 0) {
      return curr <= 0 ? 100 : 0;
    }
    if (curr <= tgt) {
      return 100;
    }
    // Over-target linear penalty
    const over = curr - tgt;
    const progress = Math.max(0, (1 - over / tgt) * 100);
    return Math.round(progress * 10) / 10;
  }

  if (type === "EXACT") {
    if (tgt === 0) {
      return curr === 0 ? 100 : 0;
    }
    const diff = Math.abs(curr - tgt);
    const progress = Math.max(0, (1 - diff / Math.abs(tgt)) * 100);
    return Math.round(progress * 10) / 10;
  }

  // Default: AT_LEAST
  const span = tgt - base;
  if (span <= 0) {
    return curr >= tgt ? 100 : 0;
  }
  const progress = Math.min(100, Math.max(0, ((curr - base) / span) * 100));
  return Math.round(progress * 10) / 10;
}

export function getTargetPrefix(targetType?: string | null): string {
  const type = (targetType || "AT_LEAST").toUpperCase();
  if (type === "AT_MOST") return "≤ ";
  if (type === "EXACT") return "= ";
  return "≥ ";
}

export function calculateAutoStatus(
  progressPercent: number
): "ON_TRACK" | "AT_RISK" | "OFF_TRACK" {
  if (progressPercent >= 80) return "ON_TRACK";
  if (progressPercent >= 50) return "AT_RISK";
  return "OFF_TRACK";
}
