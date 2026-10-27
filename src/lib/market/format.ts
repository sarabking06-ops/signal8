import { intervalLabel, reasonLabel, type FailReason, type IntervalId, type Side, type Summary } from "./analyze";

export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const digits =
    abs >= 1000 ? 2 : abs >= 100 ? 2 : abs >= 1 ? 3 : abs >= 0.1 ? 4 : abs >= 0.01 ? 5 : abs >= 0.0001 ? 6 : 8;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: abs >= 100 ? 2 : 0,
    maximumFractionDigits: digits,
  });
}

export function formatPct(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatPlainPct(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatWhen(ms: number, interval: IntervalId): string {
  const options: Intl.DateTimeFormatOptions =
    interval === "1d"
      ? { timeZone: "Asia/Tehran", month: "short", day: "numeric" }
      : { timeZone: "Asia/Tehran", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
  return new Intl.DateTimeFormat("fa-IR", options).format(new Date(ms));
}

export function sideLabel(side: Side): string {
  return side === "buy" ? "خرید" : "فروش";
}

const CHECKS: { id: FailReason; label: string }[] = [
  { id: "not-near", label: "کندل نزدیک سطح تنش" },
  { id: "no-pullback", label: "پولبک برگشته به سوینگ" },
  { id: "short-waves", label: "اکستنشن و کارکشن، هر کدام حداقل ۴ کندل" },
  { id: "correction-not-larger", label: "آخرین اصلاح بزرگ‌تر از اصلاح قبل" },
  { id: "no-orderflow", label: "کندل تغییر جریان سفارشات" },
];

export function ruleChecks(reasons: FailReason[]) {
  return CHECKS.map((check) => ({ ...check, pass: !reasons.includes(check.id) }));
}

export function setupSentence(row: Summary): string {
  const level = row.side === "sell" ? "سوینگ های" : "سوینگ لو";
  const tf = intervalLabel(row.interval);
  const corr =
    row.lastCorrectionPct != null && row.prevCorrectionPct != null
      ? ` اصلاح آخر ${formatPlainPct(row.lastCorrectionPct)} و اصلاح قبل ${formatPlainPct(row.prevCorrectionPct)}.`
      : "";
  if (row.status === "signal" && row.side) {
    return `پولبک به ${level} در ۶۰ کندل ${tf}. سیگنال ${sideLabel(row.side)}.${corr}`;
  }
  const missing = row.reasons.map(reasonLabel).join("؛ ");
  return `قیمت به ناحیه ${level} در تایم ${tf} رسیده، ولی هنوز سیگنال کامل نیست: ${missing}.`;
}

export { intervalLabel, reasonLabel };
