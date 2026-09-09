export function isRupiahUnit(unit?: string | null): boolean {
  if (!unit) return false;
  const u = unit.trim().toLowerCase();
  return u.includes("rupiah") || u.includes("rp") || u === "idr";
}

export function formatTargetValue(
  val: number | string | null | undefined,
  unit?: string | null,
  fallbackUnit: string = "",
): string {
  if (val === null || val === undefined || val === "") return "";
  const num = Number(val);
  const effectiveUnit = (unit || fallbackUnit).trim();

  if (isRupiahUnit(effectiveUnit)) {
    if (isNaN(num)) return `Rp${val}`;
    return `Rp${num.toLocaleString("en-US")}`;
  }

  return `${val}${effectiveUnit ? " " + effectiveUnit : ""}`;
}
