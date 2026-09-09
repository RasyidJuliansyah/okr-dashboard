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
): string {
  if (val === null || val === undefined || val === "") return "";
  const num = Number(val);
  const effectiveUnit = (unit || fallbackUnit).trim();

  const formattedNum = isNaN(num) ? val : num.toLocaleString("en-US");

  if (isRupiahUnit(effectiveUnit)) {
    return `Rp${formattedNum}`;
  }

  return `${formattedNum}${effectiveUnit ? " " + effectiveUnit : ""}`;
}

export function formatProgressRange(
  current: number | string | null | undefined,
  target: number | string | null | undefined,
  unit?: string | null,
): string {
  const effectiveUnit = (unit || "").trim();
  const cNum = Number(current || 0);
  const tNum = Number(target || 0);
  const formattedC = isNaN(cNum)
    ? String(current ?? "0")
    : cNum.toLocaleString("en-US");
  const formattedT = isNaN(tNum)
    ? String(target ?? "0")
    : tNum.toLocaleString("en-US");

  if (isRupiahUnit(effectiveUnit)) {
    return `Rp${formattedC} / Rp${formattedT}`;
  }

  return `${formattedC} / ${formattedT}${effectiveUnit ? " " + effectiveUnit : ""}`;
}
