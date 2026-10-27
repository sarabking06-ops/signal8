export type IntervalId = "1h" | "4h" | "1d";

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Pivot = {
  index: number;
  time: number;
  price: number;
  kind: "high" | "low";
};

export type Leg = {
  from: number;
  to: number;
  fromPrice: number;
  toPrice: number;
  direction: "up" | "down";
  candles: number;
  rangePct: number;
  role: "extension" | "correction";
  provisional: boolean;
};

export type Side = "buy" | "sell";

export type FailReason =
  | "no-swings"
  | "not-near"
  | "no-pullback"
  | "short-waves"
  | "correction-not-larger"
  | "no-orderflow";

export type Analysis = {
  status: "signal" | "watch" | "none";
  side: Side | null;
  reasons: FailReason[];
  swingHigh: Pivot | null;
  swingLow: Pivot | null;
  zone: number;
  atr: number;
  distancePct: number | null;
  legs: Leg[];
  corrections: { rangePct: number; candles: number }[];
  orderFlowIndex: number | null;
  bias: "up" | "down" | null;
};

const PIVOT = 2;
const MIN_LEG = 4;

const REASON_TEXT: Record<FailReason, string> = {
  "no-swings": "سوینگ های یا سوینگ لو تأییدشده در ۶۰ کندل کافی نیست",
  "not-near": "کندل آخر در ناحیه تنش سطح نیست",
  "no-pullback": "پولبک کامل نیست؛ قیمت هنوز از سطح فاصله نگرفته و برنگشته",
  "short-waves": "اکستنشن یا کارکشن کمتر از ۴ کندل است یا دو اصلاح کامل نداریم",
  "correction-not-larger": "آخرین اصلاح از اصلاح قبلی بزرگ‌تر نشده",
  "no-orderflow": "کندل تغییر جریان سفارشات زده نشده",
};

export function reasonLabel(reason: FailReason): string {
  return REASON_TEXT[reason];
}

export function intervalLabel(interval: IntervalId): string {
  if (interval === "1h") return "۱ ساعته";
  if (interval === "4h") return "۴ ساعته";
  return "روزانه";
}

export function intervalMs(interval: IntervalId): number {
  if (interval === "1h") return 60 * 60 * 1000;
  if (interval === "4h") return 4 * 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
}

/** Drop the still-forming candle so signals only use closed bars. */
export function closedCandles(raw: Candle[], interval: IntervalId, now = Date.now()): Candle[] {
  const ms = intervalMs(interval);
  const closed = raw.filter((c) => c.time + ms <= now);
  return closed.slice(-60);
}

function atr14(candles: Candle[]): number {
  if (candles.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1]!;
    const c = candles[i]!;
    trs.push(Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close)));
  }
  const n = Math.min(14, trs.length);
  let acc = 0;
  for (let i = 0; i < n; i++) acc += trs[i]!;
  let value = acc / n;
  for (let i = n; i < trs.length; i++) value = (value * (n - 1) + trs[i]!) / n;
  return value;
}

function isSwingHigh(candles: Candle[], i: number): boolean {
  const h = candles[i]!.high;
  for (let j = 1; j <= PIVOT; j++) {
    if (h <= candles[i - j]!.high || h <= candles[i + j]!.high) return false;
  }
  return true;
}

function isSwingLow(candles: Candle[], i: number): boolean {
  const l = candles[i]!.low;
  for (let j = 1; j <= PIVOT; j++) {
    if (l >= candles[i - j]!.low || l >= candles[i + j]!.low) return false;
  }
  return true;
}

export function findPivots(candles: Candle[]): Pivot[] {
  const out: Pivot[] = [];
  for (let i = PIVOT; i < candles.length - PIVOT; i++) {
    const high = isSwingHigh(candles, i);
    const low = isSwingLow(candles, i);
    if (high === low) continue;
    const kind = high ? "high" : "low";
    out.push({
      index: i,
      time: candles[i]!.time,
      price: high ? candles[i]!.high : candles[i]!.low,
      kind,
    });
  }
  return out;
}

function rangePct(from: number, to: number): number {
  if (from === 0) return 0;
  return (Math.abs(to - from) / Math.abs(from)) * 100;
}

/**
 * Alternate significant swings. Same-kind prints keep the more extreme one.
 * A turn is kept only when it is at least MIN_LEG bars away — each wave is
 * four candles or longer.
 */
function zigzag(pivots: Pivot[]): Pivot[] {
  const seq: Pivot[] = [];
  for (const p of pivots) {
    const last = seq[seq.length - 1];
    if (!last) {
      seq.push(p);
      continue;
    }
    if (p.kind === last.kind) {
      const more = p.kind === "high" ? p.price >= last.price : p.price <= last.price;
      if (more) seq[seq.length - 1] = p;
      continue;
    }
    if (p.index - last.index < MIN_LEG) {
      continue;
    }
    seq.push(p);
  }
  return seq;
}

function pushLeg(
  legs: Leg[],
  from: Pivot,
  toIndex: number,
  toPrice: number,
  bias: "up" | "down",
  provisional: boolean,
): void {
  const candles = toIndex - from.index;
  if (candles < MIN_LEG) return;
  const direction: "up" | "down" = toPrice >= from.price ? "up" : "down";
  const role: Leg["role"] =
    (bias === "up" && direction === "up") || (bias === "down" && direction === "down")
      ? "extension"
      : "correction";
  legs.push({
    from: from.index,
    to: toIndex,
    fromPrice: from.price,
    toPrice,
    direction,
    candles,
    rangePct: rangePct(from.price, toPrice),
    role,
    provisional,
  });
}

function buildLegs(candles: Candle[], seq: Pivot[], bias: "up" | "down"): Leg[] {
  const legs: Leg[] = [];
  for (let i = 1; i < seq.length; i++) {
    const a = seq[i - 1]!;
    const b = seq[i]!;
    pushLeg(legs, a, b.index, b.price, bias, false);
  }
  const last = seq[seq.length - 1];
  if (!last || candles.length - 1 - last.index < MIN_LEG) return legs;
  const tail = candles.slice(last.index);
  let extremePrice = last.kind === "high" ? Infinity : -Infinity;
  let extremeOffset = 0;
  tail.forEach((c, offset) => {
    const price = last.kind === "high" ? c.low : c.high;
    const more = last.kind === "high" ? price < extremePrice : price > extremePrice;
    if (more) {
      extremePrice = price;
      extremeOffset = offset;
    }
  });
  pushLeg(legs, last, last.index + extremeOffset, extremePrice, bias, true);
  return legs;
}

function bodyRatio(c: Candle): number {
  const range = c.high - c.low;
  if (range <= 0) return 0;
  return Math.abs(c.close - c.open) / range;
}

function lowerWickRatio(c: Candle): number {
  const range = c.high - c.low;
  if (range <= 0) return 0;
  return (Math.min(c.open, c.close) - c.low) / range;
}

function upperWickRatio(c: Candle): number {
  const range = c.high - c.low;
  if (range <= 0) return 0;
  return (c.high - Math.max(c.open, c.close)) / range;
}

function closeLocation(c: Candle): number {
  const range = c.high - c.low;
  if (range <= 0) return 0.5;
  return (c.close - c.low) / range;
}

function engulfs(c: Candle, prev: Candle, side: Side): boolean {
  const bodyTop = Math.max(c.open, c.close);
  const bodyBot = Math.min(c.open, c.close);
  const prevTop = Math.max(prev.open, prev.close);
  const prevBot = Math.min(prev.open, prev.close);
  if (side === "buy") return prev.close < prev.open && bodyBot <= prevBot && bodyTop >= prevTop;
  return prev.close > prev.open && bodyTop >= prevTop && bodyBot <= prevBot;
}

/**
 * Order-flow shift inside the tension zone, on one of the last four closes:
 * - structure break: close through the previous candle's high (buy) or low (sell)
 * - or a rejection pin that closes back with the new side in control
 */
function findOrderFlow(candles: Candle[], side: Side, level: number, zone: number): number | null {
  const start = Math.max(1, candles.length - 4);
  for (let i = candles.length - 1; i >= start; i--) {
    const c = candles[i]!;
    const prev = candles[i - 1]!;
    const near =
      side === "buy"
        ? c.low <= level + zone * 2.6 || prev.low <= level + zone * 2.6
        : c.high >= level - zone * 2.6 || prev.high >= level - zone * 2.6;
    if (!near) continue;
    if (side === "buy") {
      const broke = c.close > c.open && c.close > prev.high && bodyRatio(c) >= 0.35;
      const pin =
        c.close > c.open && lowerWickRatio(c) >= 0.4 && closeLocation(c) >= 0.62 && bodyRatio(c) >= 0.18;
      if (broke || pin || (c.close > c.open && engulfs(c, prev, "buy") && bodyRatio(c) >= 0.35)) return i;
    } else {
      const broke = c.close < c.open && c.close < prev.low && bodyRatio(c) >= 0.35;
      const pin =
        c.close < c.open && upperWickRatio(c) >= 0.4 && closeLocation(c) <= 0.38 && bodyRatio(c) >= 0.18;
      if (broke || pin || (c.close < c.open && engulfs(c, prev, "sell") && bodyRatio(c) >= 0.35)) return i;
    }
  }
  return null;
}

function movedAway(candles: Candle[], swingIndex: number, level: number, side: Side, need: number): boolean {
  if (candles.length - 1 - swingIndex < 6) return false;
  const mid = candles.slice(swingIndex + 1, candles.length - 1);
  if (mid.length === 0) return false;
  if (side === "buy") return Math.max(...mid.map((c) => c.close)) >= level + need;
  return Math.min(...mid.map((c) => c.close)) <= level - need;
}

function nearNow(candle: Candle, level: number, zone: number, side: Side): boolean {
  if (side === "buy") {
    return candle.low <= level + zone && candle.close <= level + zone * 2 && candle.close >= level - zone * 0.8;
  }
  return candle.high >= level - zone && candle.close >= level - zone * 2 && candle.close <= level + zone * 0.8;
}

export function analyze(candles: Candle[]): Analysis {
  const empty: Analysis = {
    status: "none",
    side: null,
    reasons: ["no-swings"],
    swingHigh: null,
    swingLow: null,
    zone: 0,
    atr: 0,
    distancePct: null,
    legs: [],
    corrections: [],
    orderFlowIndex: null,
    bias: null,
  };
  if (candles.length < 20) return empty;

  const pivots = findPivots(candles);
  const highs = pivots.filter((p) => p.kind === "high");
  const lows = pivots.filter((p) => p.kind === "low");
  if (highs.length === 0 || lows.length === 0) return empty;

  const swingHigh = highs.reduce((a, b) => (b.price > a.price || (b.price === a.price && b.index > a.index) ? b : a));
  const swingLow = lows.reduce((a, b) => (b.price < a.price || (b.price === a.price && b.index > a.index) ? b : a));
  const bias: "up" | "down" = swingLow.index <= swingHigh.index ? "up" : "down";
  const seq = zigzag(pivots);
  const legs = seq.length >= 2 ? buildLegs(candles, seq, bias) : [];
  const atr = atr14(candles);
  const last = candles[candles.length - 1]!;
  const zone = Math.max(atr * 0.35, last.close * 0.0025);

  const corrections = legs
    .filter((l) => l.role === "correction")
    .map((l) => ({ rangePct: l.rangePct, candles: l.candles }));

  const candidateSides: Side[] = [];
  if (nearNow(last, swingLow.price, zone, "buy")) candidateSides.push("buy");
  if (nearNow(last, swingHigh.price, zone, "sell")) candidateSides.push("sell");

  if (candidateSides.length === 0) {
    const dLow = Math.abs(last.close - swingLow.price) / swingLow.price;
    const dHigh = Math.abs(last.close - swingHigh.price) / swingHigh.price;
    const closer = dLow <= dHigh ? swingLow.price : swingHigh.price;
    return {
      status: "none",
      side: null,
      reasons: ["not-near"],
      swingHigh,
      swingLow,
      zone,
      atr,
      distancePct: (Math.abs(last.close - closer) / closer) * 100,
      legs,
      corrections,
      orderFlowIndex: null,
      bias,
    };
  }

  // If both zones somehow overlap (very tight range), prefer the closer level.
  const side =
    candidateSides.length === 1
      ? candidateSides[0]!
      : Math.abs(last.close - swingLow.price) <= Math.abs(last.close - swingHigh.price)
        ? "buy"
        : "sell";

  const level = side === "buy" ? swingLow : swingHigh;
  const needAway = Math.max(level.price * 0.008, zone * 2.5);
  const reasons: FailReason[] = [];
  if (!movedAway(candles, level.index, level.price, side, needAway)) reasons.push("no-pullback");

  const corr = legs.filter((l) => l.role === "correction");
  const ext = legs.filter((l) => l.role === "extension");
  const wavesOk = ext.length >= 1 && corr.length >= 2 && legs.every((l) => l.candles >= MIN_LEG);
  if (!wavesOk) reasons.push("short-waves");
  else if (corr[corr.length - 1]!.rangePct <= corr[corr.length - 2]!.rangePct) {
    reasons.push("correction-not-larger");
  }

  const orderFlowIndex = findOrderFlow(candles, side, level.price, zone);
  if (orderFlowIndex == null) reasons.push("no-orderflow");

  const distancePct = (Math.abs(last.close - level.price) / level.price) * 100;
  const watchReasons = reasons.filter((r) => r !== "not-near");
  let status: Analysis["status"] = "none";
  if (reasons.length === 0) status = "signal";
  else if (watchReasons.length > 0 && watchReasons.length <= 2) status = "watch";

  return {
    status,
    side,
    reasons,
    swingHigh,
    swingLow,
    zone,
    atr,
    distancePct,
    legs,
    corrections,
    orderFlowIndex,
    bias,
  };
}

export type Summary = {
  symbol: string;
  base: string;
  interval: IntervalId;
  status: Analysis["status"];
  side: Side | null;
  reasons: FailReason[];
  lastPrice: number;
  swingHigh: number;
  swingLow: number;
  distancePct: number | null;
  lastCorrectionPct: number | null;
  prevCorrectionPct: number | null;
  zonePct: number;
  bias: "up" | "down" | null;
  orderFlowTime: number | null;
};

export function summarize(symbol: string, interval: IntervalId, candles: Candle[]): Summary | null {
  if (candles.length < 60) return null;
  const a = analyze(candles);
  if (!a.swingHigh || !a.swingLow) return null;
  const last = candles[candles.length - 1]!;
  const corr = a.corrections;
  return {
    symbol,
    base: symbol.replace(/USDT$/, ""),
    interval,
    status: a.status,
    side: a.side,
    reasons: a.reasons,
    lastPrice: last.close,
    swingHigh: a.swingHigh.price,
    swingLow: a.swingLow.price,
    distancePct: a.distancePct,
    lastCorrectionPct: corr.length ? corr[corr.length - 1]!.rangePct : null,
    prevCorrectionPct: corr.length >= 2 ? corr[corr.length - 2]!.rangePct : null,
    zonePct: last.close ? (a.zone / last.close) * 100 : 0,
    bias: a.bias,
    orderFlowTime: a.orderFlowIndex != null ? candles[a.orderFlowIndex]!.time : null,
  };
}
