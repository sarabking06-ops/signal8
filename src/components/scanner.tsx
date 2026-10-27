import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import type { Analysis, Candle, IntervalId, Side, Summary } from "@/lib/market/analyze";
import {
  formatPct,
  formatPlainPct,
  formatPrice,
  intervalLabel,
  ruleChecks,
  setupSentence,
  sideLabel,
} from "@/lib/market/format";
import { CandleChart } from "@/components/candle-chart";

type UniverseRow = {
  symbol: string;
  base: string;
  lastPrice: number;
  changePct: number;
  quoteVolume: number;
};

type Row = Summary & { changePct: number };

type ChartState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; candles: Candle[]; analysis: Analysis };

const INTERVALS: IntervalId[] = ["1h", "4h", "1d"];
const BATCH = 12;

function keyOf(row: Pick<Row, "symbol" | "interval">): string {
  return `${row.symbol}:${row.interval}`;
}

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "درخواست ناموفق بود");
  return data;
}

export function Scanner() {
  const [universe, setUniverse] = useState<UniverseRow[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [phase, setPhase] = useState<"boot" | "scanning" | "ready" | "error">("boot");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [failed, setFailed] = useState(0);
  const [scannedAt, setScannedAt] = useState<number | null>(null);
  const [timeframe, setTimeframe] = useState<IntervalId | "all">("all");
  const [side, setSide] = useState<Side | "all">("all");
  const [onlySignals, setOnlySignals] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [chart, setChart] = useState<ChartState>({ status: "idle" });
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const changeBySymbol = new Map<string, number>();

    async function load() {
      setPhase("boot");
      setError("");
      try {
        const data = await readJson<{ symbols: UniverseRow[] }>(
          await fetch("/api/universe", { signal: controller.signal }),
        );
        if (controller.signal.aborted) return;
        data.symbols.forEach((row) => changeBySymbol.set(row.symbol, row.changePct));
        setUniverse(data.symbols);
        setRows([]);
        setFailed(0);
        setProgress(0);
        setDoneCount(0);
        setPhase("scanning");

        const batches: UniverseRow[][] = [];
        for (let i = 0; i < data.symbols.length; i += BATCH) batches.push(data.symbols.slice(i, i + BATCH));
        let cursor = 0;
        let finished = 0;
        let failedJobs = 0;
        const collected: Row[] = [];

        async function worker() {
          while (cursor < batches.length) {
            if (controller.signal.aborted) return;
            const index = cursor++;
            const batch = batches[index];
            if (!batch) continue;
            try {
              const result = await readJson<{ rows: Summary[]; failed: string[]; scanned: number }>(
                await fetch("/api/scan", {
                  method: "POST",
                  signal: controller.signal,
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    symbols: batch.map((item) => item.symbol),
                    intervals: INTERVALS,
                  }),
                }),
              );
              failedJobs += result.failed.length;
              for (const row of result.rows) {
                collected.push({ ...row, changePct: changeBySymbol.get(row.symbol) ?? 0 });
              }
            } catch (err) {
              if (controller.signal.aborted || (err instanceof Error && err.name === "AbortError")) return;
              failedJobs += batch.length * INTERVALS.length;
            }
            finished += 1;
            setDoneCount(Math.round((finished / batches.length) * data.symbols.length));
            setProgress(finished / batches.length);
            setFailed(failedJobs);
            setRows(
              [...collected].sort((a, b) => {
                const rank = (row: Row) => (row.status === "signal" ? 0 : 1);
                const byStatus = rank(a) - rank(b);
                if (byStatus) return byStatus;
                return (a.distancePct ?? 99) - (b.distancePct ?? 99);
              }),
            );
          }
        }

        await Promise.all([worker(), worker()]);
        if (controller.signal.aborted) return;
        setScannedAt(Date.now());
        setPhase("ready");
        setProgress(1);
        setDoneCount(data.symbols.length);
      } catch (err) {
        if (controller.signal.aborted) return;
        setPhase("error");
        setError(err instanceof Error ? err.message : "بازار در دسترس نیست");
      }
    }

    void load();
    return () => controller.abort();
  }, [runId]);

  const visible = useMemo(() => {
    const q = query.trim().toUpperCase();
    return rows.filter((row) => {
      if (timeframe !== "all" && row.interval !== timeframe) return false;
      if (side !== "all" && row.side !== side) return false;
      if (onlySignals && row.status !== "signal") return false;
      if (!q) return true;
      return row.base.includes(q) || row.symbol.includes(q);
    });
  }, [rows, timeframe, side, onlySignals, query]);

  const active = visible.find((row) => keyOf(row) === selectedKey) ?? visible[0] ?? null;
  const signalCount = rows.filter((row) => row.status === "signal").length;
  const watchCount = rows.filter((row) => row.status === "watch").length;

  useEffect(() => {
    if (!active) {
      setChart({ status: "idle" });
      return;
    }
    const controller = new AbortController();
    setChart({ status: "loading" });
    fetch(`/api/chart?symbol=${active.symbol}&interval=${active.interval}`, { signal: controller.signal })
      .then((response) => readJson<{ candles: Candle[]; analysis: Analysis }>(response))
      .then((data) => {
        if (!controller.signal.aborted) setChart({ status: "ready", candles: data.candles, analysis: data.analysis });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setChart({ status: "error", message: err instanceof Error ? err.message : "نمودار خوانده نشد" });
      });
    return () => controller.abort();
  }, [active?.symbol, active?.interval]);

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-fg lg:h-dvh lg:overflow-hidden">
      <header className="border-b border-line bg-surface">
        <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
          <Logo />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold leading-tight">کشش</h1>
            <p className="truncate text-sm text-muted">اسکنر پولبک سوینگ · ۱۰۰ ارز · ۶۰ کندل</p>
          </div>
          <button
            type="button"
            onClick={() => setRunId((value) => value + 1)}
            disabled={phase === "boot" || phase === "scanning"}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-ink disabled:opacity-50"
          >
            <RefreshCw className={phase === "scanning" || phase === "boot" ? "size-4 animate-spin motion-reduce:animate-none" : "size-4"} />
            اسکن دوباره
          </button>
        </div>
        <div className="h-1 bg-line">
          <div
            className="h-full bg-accent transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:grid lg:min-h-0 lg:grid-cols-12">
        <section className="order-2 border-line lg:order-1 lg:col-span-4 lg:min-h-0 lg:overflow-y-auto lg:border-e xl:col-span-3">
          <div className="sticky top-0 z-10 space-y-3 border-b border-line bg-canvas px-4 py-3">
            <div className="flex flex-wrap gap-2 text-sm">
              <Stat label="سیگنال" value={String(signalCount)} tone="accent" />
              <Stat label="دیده‌بان" value={String(watchCount)} />
              <Stat
                label="پیشرفت"
                value={phase === "ready" ? "تمام ۱۰۰" : `${doneCount} از ۱۰۰`}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip active={timeframe === "all"} onClick={() => setTimeframe("all")}>
                همه تایم‌ها
              </Chip>
              {INTERVALS.map((item) => (
                <Chip key={item} active={timeframe === item} onClick={() => setTimeframe(item)}>
                  {intervalLabel(item)}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip active={side === "all"} onClick={() => setSide("all")}>
                خرید و فروش
              </Chip>
              <Chip active={side === "buy"} onClick={() => setSide("buy")}>
                خرید
              </Chip>
              <Chip active={side === "sell"} onClick={() => setSide("sell")}>
                فروش
              </Chip>
              <Chip active={onlySignals} onClick={() => setOnlySignals((value) => !value)}>
                فقط سیگنال قطعی
              </Chip>
            </div>
            <label className="flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-3">
              <Search className="size-4 text-muted" />
              <span className="sr-only">جستجوی نماد</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="جستجو، مثل BTC"
                className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted"
              />
            </label>
          </div>

          {phase === "error" ? (
            <p className="px-4 py-8 text-sm text-sell">{error}</p>
          ) : visible.length === 0 ? (
            <p className="px-4 py-8 text-sm leading-relaxed text-muted">
              {phase === "ready"
                ? "با این فیلتر چیزی پیدا نشد. دیده‌بان‌ها ستاپ‌هایی هستند که به سطح تنش رسیده‌اند ولی هنوز همه قوانین را ندارند."
                : "در حال خواندن ۶۰ کندل آخر ۱۰۰ ارز روی سه تایم‌فریم…"}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {visible.map((row) => {
                const selected = active ? keyOf(active) === keyOf(row) : false;
                return (
                  <li key={keyOf(row)}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedKey(keyOf(row));
                        document.getElementById("chart-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className={
                        "flex w-full flex-col gap-1 px-4 py-3 text-start " +
                        (selected ? "bg-surface-2" : "hover:bg-surface")
                      }
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base font-semibold">{row.base}</span>
                        <span className="text-xs text-muted">{intervalLabel(row.interval)}</span>
                        <SideBadge side={row.side} status={row.status} />
                        <span
                          className={
                            "ms-auto text-sm tabular-nums " + (row.changePct >= 0 ? "text-buy" : "text-sell")
                          }
                        >
                          {formatPct(row.changePct)}
                        </span>
                      </span>
                      <span className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="tabular-nums">{formatPrice(row.lastPrice)}</span>
                        <span className="text-xs text-muted tabular-nums">
                          فاصله {row.distancePct == null ? "—" : formatPlainPct(row.distancePct)}
                        </span>
                      </span>
                      <span className="text-xs text-muted">
                        {row.lastCorrectionPct != null && row.prevCorrectionPct != null
                          ? `اصلاح آخر ${formatPlainPct(row.lastCorrectionPct)} در برابر قبل ${formatPlainPct(row.prevCorrectionPct)}`
                          : "اصلاح قابل مقایسه هنوز کامل نیست"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {failed > 0 ? (
            <p className="px-4 py-3 text-xs text-muted">خواندن {failed} سری کندل ناموفق بود. یک بار دیگر اسکن کنید.</p>
          ) : null}
        </section>

        <section id="chart-panel" className="order-1 lg:order-2 lg:col-span-8 lg:min-h-0 lg:overflow-y-auto xl:col-span-9">
          <div className="border-b border-line px-4 py-4 lg:px-6">
            <details className="rounded-md border border-line bg-surface">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium">
                قوانین سیگنال
              </summary>
              <ol className="space-y-2 border-t border-line px-4 py-3 text-sm leading-relaxed text-muted">
                <li>صد ارز پرمعامله اسپات تتر، روی ۱ ساعته، ۴ ساعته و روزانه. فقط ۶۰ کندل بسته‌شده آخر.</li>
                <li>سوینگ های و سوینگ لو با فراکتال دو کندل از هر طرف تأیید می‌شوند. خط سقف بالاترین سوینگ های است و خط کف پایین‌ترین سوینگ لو.</li>
                <li>ناحیه تنش دور هر خط، ۰.۳۵ برابر ATR ۱۴ است و از ۰.۲۵٪ قیمت باریک‌تر نمی‌شود. کندل آخر باید داخل این ناحیه باشد.</li>
                <li>پولبک یعنی بعد از سوینگ، قیمت حداقل ۰.۸٪ از سطح دور شده و برگشته باشد. سوینگی که تازه ساخته شده سیگنال نمی‌دهد.</li>
                <li>اکستنشن و کارکشن از سوینگ‌های پشت‌سرهم ساخته می‌شوند و هر کدام باید حداقل ۴ کندل باشند. حداقل یک اکستنشن و دو کارکشن لازم است.</li>
                <li>در ساختار صعودی موج بالا اکستنشن است و موج پایین کارکشن. در ساختار نزولی برعکس. آخرین کارکشن باید از کارکشن قبلی درصد بزرگ‌تری داشته باشد.</li>
                <li>کندل تغییر جریان سفارشات باید در چهار کندل آخر و کنار سطح زده شده باشد: کلوز از سقف یا کف کندل قبل عبور کند، یا پین ریجکشن، یا اینگالف بدنه.</li>
                <li>رسیدن به سوینگ لو سیگنال خرید است و رسیدن به سوینگ های سیگنال فروش. دیده‌بان یعنی قیمت در ناحیه است ولی یکی دو قانون هنوز جا مانده.</li>
              </ol>
            </details>
          </div>

          {!active ? (
            <div className="px-4 py-16 text-sm text-muted lg:px-6">
              {phase === "ready"
                ? "هیچ ستاپی با فیلتر فعلی در ناحیه تنش نیست."
                : "نمودار بعد از پیدا شدن اولین ستاپ اینجا می‌آید."}
            </div>
          ) : (
            <div className="px-4 py-4 lg:px-6">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">
                    {active.base}
                    <span className="ms-2 text-sm font-normal text-muted">{intervalLabel(active.interval)}</span>
                  </h2>
                  <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">{setupSentence(active)}</p>
                </div>
                <div className="text-end">
                  <div className="text-lg font-semibold tabular-nums">{formatPrice(active.lastPrice)}</div>
                  <div className={active.changePct >= 0 ? "text-sm text-buy tabular-nums" : "text-sm text-sell tabular-nums"}>
                    ۲۴ ساعت {formatPct(active.changePct)}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-md border border-line bg-canvas">
                {chart.status === "ready" ? (
                  <CandleChart candles={chart.candles} analysis={chart.analysis} interval={active.interval} />
                ) : (
                  <div className="flex h-72 items-center justify-center text-sm text-muted lg:h-96">
                    {chart.status === "error" ? chart.message : "در حال چیدن ۶۰ کندل و خط‌های سوینگ…"}
                  </div>
                )}
                <ul className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-3 py-2 text-xs text-muted">
                  <li className="flex items-center gap-1">
                    <span className="inline-block h-0.5 w-4 bg-sell" /> سوینگ های
                  </li>
                  <li className="flex items-center gap-1">
                    <span className="inline-block h-0.5 w-4 bg-buy" /> سوینگ لو
                  </li>
                  <li className="flex items-center gap-1">
                    <span className="inline-block h-0.5 w-4 bg-buy" /> اکستنشن
                  </li>
                  <li className="flex items-center gap-1">
                    <span className="inline-block h-px w-4 border-t border-dashed border-accent" /> کارکشن
                  </li>
                  <li className="flex items-center gap-1">
                    <span className="inline-block size-2 bg-accent" /> کندل جریان
                  </li>
                </ul>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="سوینگ های" value={formatPrice(active.swingHigh)} />
                <Metric label="سوینگ لو" value={formatPrice(active.swingLow)} />
                <Metric
                  label="فاصله تا سطح"
                  value={active.distancePct == null ? "—" : formatPlainPct(active.distancePct)}
                />
                <Metric
                  label="ساختار"
                  value={active.bias === "up" ? "صعودی" : active.bias === "down" ? "نزولی" : "—"}
                />
              </div>

              <ul className="mt-4 divide-y divide-line rounded-md border border-line">
                {(chart.status === "ready" ? ruleChecks(chart.analysis.reasons) : ruleChecks(active.reasons)).map(
                  (check) => (
                    <li key={check.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <span>{check.label}</span>
                      <span className={check.pass ? "text-buy" : "text-sell"}>{check.pass ? "بله" : "نه"}</span>
                    </li>
                  ),
                )}
              </ul>

              <p className="mt-4 text-xs leading-relaxed text-muted">
                زمان کندل‌ها به وقت تهران است. داده از بازار اسپات است و سیگنال فقط خروجی این قوانین است، نه توصیه خرید یا فروش.
                {scannedAt ? ` آخرین اسکن: ${new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit" }).format(scannedAt)}.` : ""}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="size-10 shrink-0" aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-surface-2" />
      <path d="M7 23h18" className="stroke-buy" strokeWidth="1.8" />
      <path d="M7 9h18" className="stroke-sell" strokeWidth="1.8" />
      <path d="M8 18l4-5 4 4 4-7 4 5" className="stroke-accent" fill="none" strokeWidth="1.6" />
    </svg>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={
        "h-11 rounded-md px-3 text-sm " +
        (active ? "bg-accent text-ink" : "bg-surface text-fg ring-1 ring-line")
      }
    >
      {children}
    </button>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "accent" }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-sm bg-surface px-2 py-1">
      <span className="text-muted">{label}</span>
      <span className={tone === "accent" ? "font-semibold text-accent tabular-nums" : "font-semibold tabular-nums"}>
        {value}
      </span>
    </span>
  );
}

function SideBadge({ side, status }: { side: Side | null; status: Row["status"] }) {
  if (!side) return null;
  const signal = status === "signal";
  const klass =
    side === "buy"
      ? signal
        ? "bg-buy text-ink"
        : "text-buy ring-1 ring-buy"
      : signal
        ? "bg-sell text-ink"
        : "text-sell ring-1 ring-sell";
  return (
    <span className={"rounded-sm px-1.5 py-0.5 text-xs font-medium " + klass}>
      {signal ? sideLabel(side) : `دیده‌بان ${sideLabel(side)}`}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}
