import { analyze, closedCandles, summarize, type Candle, type IntervalId, type Summary } from "./analyze";

const HOST = "https://data-api.binance.vision";

const STABLES = new Set([
  "USDC",
  "FDUSD",
  "TUSD",
  "USDP",
  "DAI",
  "EUR",
  "GBP",
  "TRY",
  "BRL",
  "AUD",
  "BUSD",
  "USD1",
  "USDE",
  "XUSD",
  "AEUR",
  "EURI",
  "USDS",
  "RLUSD",
  "USD",
  "USDD",
  "PYUSD",
  "GUSD",
  "FRAX",
  "LUSD",
  "USTC",
  "BFUSD",
]);

/** Crypto bases that legitimately end in B. Everything else *B is a stock token. */
const CRYPTO_ENDING_B = new Set(["BNB", "ARB", "SHIB", "1000SHIB", "TRB", "CKB", "DGB", "BB", "VIB", "PHB"]);

export type UniverseRow = {
  symbol: string;
  base: string;
  lastPrice: number;
  changePct: number;
  quoteVolume: number;
};

type CacheEntry = { exp: number; body: unknown };
const cache = new Map<string, CacheEntry>();

async function binanceGet(path: string, ttlMs: number): Promise<unknown> {
  const hit = cache.get(path);
  if (hit && hit.exp > Date.now()) return hit.body;
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${HOST}${path}`, { headers: { accept: "application/json" } });
      if (res.status === 429 || res.status === 418) {
        await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`binance ${res.status}`);
      const body: unknown = await res.json();
      cache.set(path, { exp: Date.now() + ttlMs, body });
      return body;
    } catch (error) {
      lastError = error;
      await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("binance unavailable");
}

function tradableBase(base: string): boolean {
  if (STABLES.has(base) || base.includes("USD")) return false;
  if (/(UP|DOWN|BULL|BEAR)$/.test(base)) return false;
  if (base.endsWith("B") && !CRYPTO_ENDING_B.has(base)) return false;
  return /^[A-Z0-9]{2,15}$/.test(base);
}

type Ticker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
};

export async function loadUniverse(): Promise<UniverseRow[]> {
  const raw = (await binanceGet("/api/v3/ticker/24hr", 60_000)) as Ticker[];
  return raw
    .filter((row) => row.symbol.endsWith("USDT") && tradableBase(row.symbol.slice(0, -4)))
    .sort((a, b) => Number(b.quoteVolume) - Number(a.quoteVolume))
    .slice(0, 100)
    .map((row) => ({
      symbol: row.symbol,
      base: row.symbol.slice(0, -4),
      lastPrice: Number(row.lastPrice),
      changePct: Number(row.priceChangePercent),
      quoteVolume: Number(row.quoteVolume),
    }));
}

function parseKlines(raw: unknown): Candle[] {
  if (!Array.isArray(raw)) return [];
  const candles: Candle[] = [];
  for (const row of raw) {
    if (!Array.isArray(row) || row.length < 6) continue;
    const candle = {
      time: Number(row[0]),
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5]),
    };
    if ([candle.time, candle.open, candle.high, candle.low, candle.close].every(Number.isFinite)) {
      candles.push(candle);
    }
  }
  return candles;
}

async function klines(symbol: string, interval: IntervalId): Promise<Candle[]> {
  const raw = await binanceGet(`/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=61`, 45_000);
  return closedCandles(parseKlines(raw), interval);
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      out[index] = await fn(items[index]!);
    }
  });
  await Promise.all(workers);
  return out;
}

export async function scanSymbols(
  symbols: string[],
  intervals: IntervalId[],
): Promise<{ rows: Summary[]; failed: string[]; scanned: number }> {
  const jobs = symbols.flatMap((symbol) => intervals.map((interval) => ({ symbol, interval })));
  const failed: string[] = [];
  const rows: Summary[] = [];
  await mapPool(jobs, 8, async (job) => {
    try {
      const candles = await klines(job.symbol, job.interval);
      const summary = summarize(job.symbol, job.interval, candles);
      if (summary && summary.status !== "none") rows.push(summary);
    } catch {
      failed.push(`${job.symbol}:${job.interval}`);
    }
  });
  return { rows, failed, scanned: jobs.length };
}

export async function loadChart(symbol: string, interval: IntervalId) {
  const candles = await klines(symbol, interval);
  return { symbol, interval, candles, analysis: analyze(candles) };
}
