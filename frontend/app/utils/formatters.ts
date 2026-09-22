export function isRupiahUnit(unit?: string | null): boolean {
  if (!unit) return false;
  const u = unit.trim().toLowerCase();
  return u.includes("rupiah") || u.includes("rp") || u === "idr";
}

export function isPercentUnit(unit?: string | null): boolean {
  if (!unit) return false;
  const u = unit.trim().toLowerCase();
  return u === "%" || u.includes("persen") || u.includes("percent");
}

export function validateAndClampTargetValue(
  val: number | string | null | undefined,
  unit?: string | null,
): number {
  let num = Number(val) || 0;
  if (num < 0) num = 0;
  if (isPercentUnit(unit) && num > 100) {
    num = 100;
  }
  return num;
}

export function clampPercentTarget(formObj: any): void {
  if (
    formObj &&
    isPercentUnit(formObj.unit) &&
    typeof formObj.targetValue === "number" &&
    formObj.targetValue > 100
  ) {
    formObj.targetValue = 100;
  }
}

export function formatTargetValue(
  val: number | string | null | undefined,
  unit?: string | null,
  fallbackUnit: string = "",
  targetType?: string | null,
): string {
  if (val === null || val === undefined || val === "") return "";
  const num = Number(val);
  const effectiveUnit = (unit || fallbackUnit).trim();
  const prefix = targetType ? getTargetPrefix(targetType) : "";

  const formattedNum = isNaN(num) ? val : num.toLocaleString("en-US");

  if (isRupiahUnit(effectiveUnit)) {
    return `${prefix}Rp${formattedNum}`;
  }

  return `${prefix}${formattedNum}${effectiveUnit ? " " + effectiveUnit : ""}`;
}

export function formatProgressRange(
  current: number | string | null | undefined,
  target: number | string | null | undefined,
  unit?: string | null,
  targetType?: string | null,
): string {
  const effectiveUnit = (unit || "").trim();
  const cNum = Number(current || 0);
  const tNum = Number(target || 0);
  const prefix = targetType ? getTargetPrefix(targetType) : "";
  const formattedC = isNaN(cNum)
    ? String(current ?? "0")
    : cNum.toLocaleString("en-US");
  const formattedT = isNaN(tNum)
    ? String(target ?? "0")
    : tNum.toLocaleString("en-US");

  if (isRupiahUnit(effectiveUnit)) {
    return `Rp${formattedC} / ${prefix}Rp${formattedT}`;
  }

  return `${formattedC} / ${prefix}${formattedT}${effectiveUnit ? " " + effectiveUnit : ""}`;
}

export type TargetType = "AT_LEAST" | "AT_MOST" | "EXACT";

export const TARGET_TYPE_OPTIONS = [
  { value: "AT_LEAST", label: "Minimal (≥) — Makin tinggi makin baik" },
  { value: "AT_MOST", label: "Maksimal (≤) — Budget / Cost / Churn" },
  { value: "EXACT", label: "Tepat (=) — Presisi / Headcount" },
];

export function getTargetPrefix(targetType?: string | null): string {
  const type = (targetType || "AT_LEAST").toUpperCase();
  if (type === "AT_MOST") return "≤ ";
  if (type === "EXACT") return "= ";
  return "≥ ";
}

export function calculateProgressPercent(
  current: number | null | undefined,
  target: number | null | undefined,
  targetType: string = "AT_LEAST",
  baseline: number = 0
): number {
  if (target === null || target === undefined || isNaN(Number(target))) return 0;
  const curr = Number(current || 0);
  const tgt = Number(target);
  const base = Number(baseline || 0);
  const type = (targetType || "AT_LEAST").toUpperCase();

  if (type === "AT_MOST") {
    if (tgt <= 0) return curr <= 0 ? 100 : 0;
    if (curr <= tgt) return 100;
    const over = curr - tgt;
    const progress = Math.max(0, (1 - over / tgt) * 100);
    return Math.round(progress * 10) / 10;
  }

  if (type === "EXACT") {
    if (tgt === 0) return curr === 0 ? 100 : 0;
    const diff = Math.abs(curr - tgt);
    const progress = Math.max(0, (1 - diff / Math.abs(tgt)) * 100);
    return Math.round(progress * 10) / 10;
  }

  // AT_LEAST
  const span = tgt - base;
  if (span <= 0) return curr >= tgt ? 100 : 0;
  const progress = Math.min(100, Math.max(0, ((curr - base) / span) * 100));
  return Math.round(progress * 10) / 10;
}

export function calculateAutoStatus(
  progressPercent: number
): "ON_TRACK" | "AT_RISK" | "OFF_TRACK" {
  if (progressPercent >= 80) return "ON_TRACK";
  if (progressPercent >= 50) return "AT_RISK";
  return "OFF_TRACK";
}
