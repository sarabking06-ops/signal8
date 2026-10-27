import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Search, r as RefreshCw } from "../_libs/lucide-react.mjs";
import { n as intervalLabel, r as reasonLabel } from "./router-B1c1_mrk.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Z2qWPt9N.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function formatPrice(value) {
	if (!Number.isFinite(value)) return "—";
	const abs = Math.abs(value);
	const digits = abs >= 1e3 ? 2 : abs >= 100 ? 2 : abs >= 1 ? 3 : abs >= .1 ? 4 : abs >= .01 ? 5 : abs >= 1e-4 ? 6 : 8;
	return value.toLocaleString("en-US", {
		minimumFractionDigits: abs >= 100 ? 2 : 0,
		maximumFractionDigits: digits
	});
}
function formatPct(value, digits = 2) {
	if (!Number.isFinite(value)) return "—";
	return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}
function formatPlainPct(value, digits = 2) {
	if (!Number.isFinite(value)) return "—";
	return `${value.toFixed(digits)}%`;
}
function formatWhen(ms, interval) {
	const options = interval === "1d" ? {
		timeZone: "Asia/Tehran",
		month: "short",
		day: "numeric"
	} : {
		timeZone: "Asia/Tehran",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit"
	};
	return new Intl.DateTimeFormat("fa-IR", options).format(new Date(ms));
}
function sideLabel(side) {
	return side === "buy" ? "خرید" : "فروش";
}
var CHECKS = [
	{
		id: "not-near",
		label: "کندل نزدیک سطح تنش"
	},
	{
		id: "no-pullback",
		label: "پولبک برگشته به سوینگ"
	},
	{
		id: "short-waves",
		label: "اکستنشن و کارکشن، هر کدام حداقل ۴ کندل"
	},
	{
		id: "correction-not-larger",
		label: "آخرین اصلاح بزرگ‌تر از اصلاح قبل"
	},
	{
		id: "no-orderflow",
		label: "کندل تغییر جریان سفارشات"
	}
];
function ruleChecks(reasons) {
	return CHECKS.map((check) => ({
		...check,
		pass: !reasons.includes(check.id)
	}));
}
function setupSentence(row) {
	const level = row.side === "sell" ? "سوینگ های" : "سوینگ لو";
	const tf = intervalLabel(row.interval);
	const corr = row.lastCorrectionPct != null && row.prevCorrectionPct != null ? ` اصلاح آخر ${formatPlainPct(row.lastCorrectionPct)} و اصلاح قبل ${formatPlainPct(row.prevCorrectionPct)}.` : "";
	if (row.status === "signal" && row.side) return `پولبک به ${level} در ۶۰ کندل ${tf}. سیگنال ${sideLabel(row.side)}.${corr}`;
	return `قیمت به ناحیه ${level} در تایم ${tf} رسیده، ولی هنوز سیگنال کامل نیست: ${row.reasons.map(reasonLabel).join("؛ ")}.`;
}
function token(name, fallback) {
	if (typeof document === "undefined") return fallback;
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
function CandleChart({ candles, analysis, interval }) {
	const wrapRef = (0, import_react.useRef)(null);
	const canvasRef = (0, import_react.useRef)(null);
	const [hover, setHover] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const wrap = wrapRef.current;
		const canvas = canvasRef.current;
		if (!wrap || !canvas || candles.length === 0) return;
		const draw = () => {
			const width = wrap.clientWidth;
			const height = wrap.clientHeight;
			if (width < 20 || height < 20) return;
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = Math.floor(width * dpr);
			canvas.height = Math.floor(height * dpr);
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			const bg = token("--color-canvas", "#101418");
			const grid = token("--color-line", "#2c3842");
			const muted = token("--color-muted", "#8d9aa6");
			const fg = token("--color-fg", "#e7eef3");
			const buy = token("--color-buy", "#2faf7a");
			const sell = token("--color-sell", "#e15d66");
			const accent = token("--color-accent", "#e0a84a");
			const pad = {
				top: 16,
				right: 72,
				bottom: 22,
				left: 8
			};
			const volumeH = Math.max(28, height * .16);
			const plot = {
				x: pad.left,
				y: pad.top,
				w: width - pad.left - pad.right,
				h: height - pad.top - pad.bottom - volumeH - 8
			};
			const vol = {
				x: plot.x,
				y: plot.y + plot.h + 8,
				w: plot.w,
				h: volumeH
			};
			let min = Infinity;
			let max = -Infinity;
			for (const candle of candles) {
				min = Math.min(min, candle.low);
				max = Math.max(max, candle.high);
			}
			if (analysis.swingLow) {
				min = Math.min(min, analysis.swingLow.price - analysis.zone);
				max = Math.max(max, analysis.swingLow.price + analysis.zone);
			}
			if (analysis.swingHigh) {
				min = Math.min(min, analysis.swingHigh.price - analysis.zone);
				max = Math.max(max, analysis.swingHigh.price + analysis.zone);
			}
			if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
				min = candles[0].low * .99;
				max = candles[0].high * 1.01;
			}
			const padPrice = (max - min) * .06;
			min -= padPrice;
			max += padPrice;
			const xAt = (index) => plot.x + (index + .5) / candles.length * plot.w;
			const yAt = (price) => plot.y + (max - price) / (max - min) * plot.h;
			const slot = plot.w / candles.length;
			const bodyW = Math.max(2.5, Math.min(10, slot * .62));
			ctx.clearRect(0, 0, width, height);
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, width, height);
			ctx.strokeStyle = grid;
			ctx.lineWidth = 1;
			ctx.font = "11px Vazirmatn, sans-serif";
			ctx.fillStyle = muted;
			ctx.textAlign = "left";
			ctx.textBaseline = "middle";
			for (let i = 0; i <= 4; i++) {
				const price = max - (max - min) * i / 4;
				const y = yAt(price);
				ctx.beginPath();
				ctx.moveTo(plot.x, y);
				ctx.lineTo(plot.x + plot.w, y);
				ctx.stroke();
				ctx.fillText(formatPrice(price), plot.x + plot.w + 8, y);
			}
			const zoneOf = (level, color) => {
				const y1 = yAt(level + analysis.zone);
				const y2 = yAt(level - analysis.zone);
				ctx.fillStyle = color;
				ctx.globalAlpha = .12;
				ctx.fillRect(plot.x, Math.min(y1, y2), plot.w, Math.abs(y2 - y1));
				ctx.globalAlpha = 1;
			};
			if (analysis.swingLow) zoneOf(analysis.swingLow.price, buy);
			if (analysis.swingHigh) zoneOf(analysis.swingHigh.price, sell);
			const maxVol = Math.max(...candles.map((c) => c.volume), 1);
			candles.forEach((candle, index) => {
				const x = xAt(index);
				const color = candle.close >= candle.open ? buy : sell;
				const vh = candle.volume / maxVol * vol.h;
				ctx.globalAlpha = .45;
				ctx.fillStyle = color;
				ctx.fillRect(x - bodyW / 2, vol.y + vol.h - vh, bodyW, vh);
				ctx.globalAlpha = 1;
				ctx.strokeStyle = color;
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(x, yAt(candle.high));
				ctx.lineTo(x, yAt(candle.low));
				ctx.stroke();
				const yOpen = yAt(candle.open);
				const yClose = yAt(candle.close);
				const top = Math.min(yOpen, yClose);
				const h = Math.max(1, Math.abs(yClose - yOpen));
				ctx.fillStyle = color;
				ctx.fillRect(x - bodyW / 2, top, bodyW, h);
			});
			const trace = (from, to, fromPrice, toPrice, color, dashed) => {
				ctx.beginPath();
				ctx.strokeStyle = color;
				ctx.lineWidth = 2;
				ctx.setLineDash(dashed ? [4, 4] : []);
				ctx.moveTo(xAt(from), yAt(fromPrice));
				ctx.lineTo(xAt(to), yAt(toPrice));
				ctx.stroke();
				ctx.setLineDash([]);
			};
			for (const leg of analysis.legs) {
				const color = leg.role === "extension" ? leg.direction === "up" ? buy : sell : accent;
				trace(leg.from, leg.to, leg.fromPrice, leg.toPrice, color, leg.role === "correction");
			}
			const hLine = (price, color, label, yShift) => {
				const y = yAt(price) + yShift;
				ctx.strokeStyle = color;
				ctx.lineWidth = 1.25;
				ctx.setLineDash([6, 4]);
				ctx.beginPath();
				ctx.moveTo(plot.x, yAt(price));
				ctx.lineTo(plot.x + plot.w, yAt(price));
				ctx.stroke();
				ctx.setLineDash([]);
				ctx.font = "12px Vazirmatn, sans-serif";
				const textW = ctx.measureText(label).width;
				ctx.fillStyle = bg;
				ctx.globalAlpha = .9;
				ctx.fillRect(plot.x + 6, y - 16, textW + 10, 16);
				ctx.globalAlpha = 1;
				ctx.fillStyle = color;
				ctx.textAlign = "left";
				ctx.textBaseline = "alphabetic";
				ctx.fillText(label, plot.x + 11, y - 4);
			};
			const highY = analysis.swingHigh ? yAt(analysis.swingHigh.price) : null;
			const lowY = analysis.swingLow ? yAt(analysis.swingLow.price) : null;
			const tight = highY != null && lowY != null && Math.abs(highY - lowY) < 28;
			if (analysis.swingHigh) hLine(analysis.swingHigh.price, sell, "سوینگ های", tight ? -10 : 0);
			if (analysis.swingLow) hLine(analysis.swingLow.price, buy, "سوینگ لو", tight ? 12 : 0);
			if (analysis.orderFlowIndex != null) {
				const candle = candles[analysis.orderFlowIndex];
				if (candle) {
					const x = xAt(analysis.orderFlowIndex);
					const up = analysis.side !== "sell";
					ctx.strokeStyle = accent;
					ctx.lineWidth = 1.5;
					const top = yAt(candle.high);
					const bot = yAt(candle.low);
					ctx.strokeRect(x - bodyW / 2 - 3, top - 3, bodyW + 6, Math.max(8, bot - top) + 6);
					ctx.fillStyle = accent;
					ctx.font = "11px Vazirmatn, sans-serif";
					ctx.textAlign = "center";
					ctx.textBaseline = "alphabetic";
					ctx.fillText("جریان", x, up ? bot + 18 : top - 8);
				}
			}
			ctx.fillStyle = muted;
			ctx.font = "11px Vazirmatn, sans-serif";
			ctx.textAlign = "center";
			ctx.textBaseline = "alphabetic";
			const ticks = 4;
			for (let i = 0; i < ticks; i++) {
				const index = Math.round((candles.length - 1) * i / 3);
				const candle = candles[index];
				if (!candle) continue;
				ctx.fillText(formatWhen(candle.time, interval), xAt(index), height - 6);
			}
			if (hover) {
				if (candles[hover.index]) {
					const x = xAt(hover.index);
					ctx.strokeStyle = fg;
					ctx.globalAlpha = .35;
					ctx.lineWidth = 1;
					ctx.setLineDash([]);
					ctx.beginPath();
					ctx.moveTo(x, plot.y);
					ctx.lineTo(x, vol.y + vol.h);
					ctx.stroke();
					ctx.globalAlpha = 1;
				}
			}
		};
		document.fonts.ready.then(draw);
		draw();
		const observer = new ResizeObserver(draw);
		observer.observe(wrap);
		return () => observer.disconnect();
	}, [
		candles,
		analysis,
		interval,
		hover
	]);
	const onPointer = (event) => {
		const canvas = canvasRef.current;
		if (!canvas || candles.length === 0) return;
		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const plotX = 8;
		const plotW = rect.width - 8 - 72;
		const ratio = (x - plotX) / plotW;
		const index = Math.min(candles.length - 1, Math.max(0, Math.floor(ratio * candles.length)));
		setHover({
			index,
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		});
	};
	const hovered = hover ? candles[hover.index] : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: wrapRef,
			className: "h-72 w-full lg:h-96",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: "h-full w-full touch-pan-y",
				onPointerMove: onPointer,
				onPointerLeave: () => setHover(null)
			})
		}), hovered ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pointer-events-none absolute top-2 left-2 rounded-sm bg-surface px-2 py-1 text-xs text-fg tabular-nums",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-muted",
					children: formatWhen(hovered.time, interval)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "ms-2",
					children: ["O ", formatPrice(hovered.open)]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "ms-2",
					children: ["H ", formatPrice(hovered.high)]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "ms-2",
					children: ["L ", formatPrice(hovered.low)]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "ms-2",
					children: ["C ", formatPrice(hovered.close)]
				})
			]
		}) : null]
	});
}
var INTERVALS = [
	"1h",
	"4h",
	"1d"
];
var BATCH = 12;
function keyOf(row) {
	return `${row.symbol}:${row.interval}`;
}
async function readJson(response) {
	const data = await response.json();
	if (!response.ok) throw new Error(data.error || "درخواست ناموفق بود");
	return data;
}
function Scanner() {
	const [universe, setUniverse] = (0, import_react.useState)([]);
	const [rows, setRows] = (0, import_react.useState)([]);
	const [phase, setPhase] = (0, import_react.useState)("boot");
	const [error, setError] = (0, import_react.useState)("");
	const [progress, setProgress] = (0, import_react.useState)(0);
	const [doneCount, setDoneCount] = (0, import_react.useState)(0);
	const [failed, setFailed] = (0, import_react.useState)(0);
	const [scannedAt, setScannedAt] = (0, import_react.useState)(null);
	const [timeframe, setTimeframe] = (0, import_react.useState)("all");
	const [side, setSide] = (0, import_react.useState)("all");
	const [onlySignals, setOnlySignals] = (0, import_react.useState)(false);
	const [query, setQuery] = (0, import_react.useState)("");
	const [selectedKey, setSelectedKey] = (0, import_react.useState)(null);
	const [chart, setChart] = (0, import_react.useState)({ status: "idle" });
	const [runId, setRunId] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		const controller = new AbortController();
		const changeBySymbol = /* @__PURE__ */ new Map();
		async function load() {
			setPhase("boot");
			setError("");
			try {
				const data = await readJson(await fetch("/api/universe", { signal: controller.signal }));
				if (controller.signal.aborted) return;
				data.symbols.forEach((row) => changeBySymbol.set(row.symbol, row.changePct));
				setUniverse(data.symbols);
				setRows([]);
				setFailed(0);
				setProgress(0);
				setDoneCount(0);
				setPhase("scanning");
				const batches = [];
				for (let i = 0; i < data.symbols.length; i += BATCH) batches.push(data.symbols.slice(i, i + BATCH));
				let cursor = 0;
				let finished = 0;
				let failedJobs = 0;
				const collected = [];
				async function worker() {
					while (cursor < batches.length) {
						if (controller.signal.aborted) return;
						const index = cursor++;
						const batch = batches[index];
						if (!batch) continue;
						try {
							const result = await readJson(await fetch("/api/scan", {
								method: "POST",
								signal: controller.signal,
								headers: { "content-type": "application/json" },
								body: JSON.stringify({
									symbols: batch.map((item) => item.symbol),
									intervals: INTERVALS
								})
							}));
							failedJobs += result.failed.length;
							for (const row of result.rows) collected.push({
								...row,
								changePct: changeBySymbol.get(row.symbol) ?? 0
							});
						} catch (err) {
							if (controller.signal.aborted || err instanceof Error && err.name === "AbortError") return;
							failedJobs += batch.length * INTERVALS.length;
						}
						finished += 1;
						setDoneCount(Math.round(finished / batches.length * data.symbols.length));
						setProgress(finished / batches.length);
						setFailed(failedJobs);
						setRows([...collected].sort((a, b) => {
							const rank = (row) => row.status === "signal" ? 0 : 1;
							const byStatus = rank(a) - rank(b);
							if (byStatus) return byStatus;
							return (a.distancePct ?? 99) - (b.distancePct ?? 99);
						}));
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
		load();
		return () => controller.abort();
	}, [runId]);
	const visible = (0, import_react.useMemo)(() => {
		const q = query.trim().toUpperCase();
		return rows.filter((row) => {
			if (timeframe !== "all" && row.interval !== timeframe) return false;
			if (side !== "all" && row.side !== side) return false;
			if (onlySignals && row.status !== "signal") return false;
			if (!q) return true;
			return row.base.includes(q) || row.symbol.includes(q);
		});
	}, [
		rows,
		timeframe,
		side,
		onlySignals,
		query
	]);
	const active = visible.find((row) => keyOf(row) === selectedKey) ?? visible[0] ?? null;
	const signalCount = rows.filter((row) => row.status === "signal").length;
	const watchCount = rows.filter((row) => row.status === "watch").length;
	(0, import_react.useEffect)(() => {
		if (!active) {
			setChart({ status: "idle" });
			return;
		}
		const controller = new AbortController();
		setChart({ status: "loading" });
		fetch(`/api/chart?symbol=${active.symbol}&interval=${active.interval}`, { signal: controller.signal }).then((response) => readJson(response)).then((data) => {
			if (!controller.signal.aborted) setChart({
				status: "ready",
				candles: data.candles,
				analysis: data.analysis
			});
		}).catch((err) => {
			if (controller.signal.aborted) return;
			setChart({
				status: "error",
				message: err instanceof Error ? err.message : "نمودار خوانده نشد"
			});
		});
		return () => controller.abort();
	}, [active?.symbol, active?.interval]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh flex-col bg-canvas text-fg lg:h-dvh lg:overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "border-b border-line bg-surface",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 px-4 py-3 lg:px-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-lg font-semibold leading-tight",
							children: "کشش"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-sm text-muted",
							children: "اسکنر پولبک سوینگ · ۱۰۰ ارز · ۶۰ کندل"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setRunId((value) => value + 1),
						disabled: phase === "boot" || phase === "scanning",
						className: "inline-flex h-11 items-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-ink disabled:opacity-50",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: phase === "scanning" || phase === "boot" ? "size-4 animate-spin motion-reduce:animate-none" : "size-4" }), "اسکن دوباره"]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-1 bg-line",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-full bg-accent transition-[width] duration-300 motion-reduce:transition-none",
					style: { width: `${Math.round(progress * 100)}%` }
				})
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-1 flex-col lg:grid lg:min-h-0 lg:grid-cols-12",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "order-2 border-line lg:order-1 lg:col-span-4 lg:min-h-0 lg:overflow-y-auto lg:border-e xl:col-span-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "sticky top-0 z-10 space-y-3 border-b border-line bg-canvas px-4 py-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-2 text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										label: "سیگنال",
										value: String(signalCount),
										tone: "accent"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										label: "دیده‌بان",
										value: String(watchCount)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										label: "پیشرفت",
										value: phase === "ready" ? "تمام ۱۰۰" : `${doneCount} از ۱۰۰`
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
									active: timeframe === "all",
									onClick: () => setTimeframe("all"),
									children: "همه تایم‌ها"
								}), INTERVALS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
									active: timeframe === item,
									onClick: () => setTimeframe(item),
									children: intervalLabel(item)
								}, item))]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										active: side === "all",
										onClick: () => setSide("all"),
										children: "خرید و فروش"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										active: side === "buy",
										onClick: () => setSide("buy"),
										children: "خرید"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										active: side === "sell",
										onClick: () => setSide("sell"),
										children: "فروش"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										active: onlySignals,
										onClick: () => setOnlySignals((value) => !value),
										children: "فقط سیگنال قطعی"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4 text-muted" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "sr-only",
										children: "جستجوی نماد"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: query,
										onChange: (event) => setQuery(event.target.value),
										placeholder: "جستجو، مثل BTC",
										className: "w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted"
									})
								]
							})
						]
					}),
					phase === "error" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-4 py-8 text-sm text-sell",
						children: error
					}) : visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-4 py-8 text-sm leading-relaxed text-muted",
						children: phase === "ready" ? "با این فیلتر چیزی پیدا نشد. دیده‌بان‌ها ستاپ‌هایی هستند که به سطح تنش رسیده‌اند ولی هنوز همه قوانین را ندارند." : "در حال خواندن ۶۰ کندل آخر ۱۰۰ ارز روی سه تایم‌فریم…"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "divide-y divide-line",
						children: visible.map((row) => {
							const selected = active ? keyOf(active) === keyOf(row) : false;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => {
									setSelectedKey(keyOf(row));
									document.getElementById("chart-panel")?.scrollIntoView({
										behavior: "smooth",
										block: "start"
									});
								},
								className: "flex w-full flex-col gap-1 px-4 py-3 text-start " + (selected ? "bg-surface-2" : "hover:bg-surface"),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-base font-semibold",
												children: row.base
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-muted",
												children: intervalLabel(row.interval)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SideBadge, {
												side: row.side,
												status: row.status
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "ms-auto text-sm tabular-nums " + (row.changePct >= 0 ? "text-buy" : "text-sell"),
												children: formatPct(row.changePct)
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-baseline justify-between gap-3 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "tabular-nums",
											children: formatPrice(row.lastPrice)
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-xs text-muted tabular-nums",
											children: ["فاصله ", row.distancePct == null ? "—" : formatPlainPct(row.distancePct)]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-muted",
										children: row.lastCorrectionPct != null && row.prevCorrectionPct != null ? `اصلاح آخر ${formatPlainPct(row.lastCorrectionPct)} در برابر قبل ${formatPlainPct(row.prevCorrectionPct)}` : "اصلاح قابل مقایسه هنوز کامل نیست"
									})
								]
							}) }, keyOf(row));
						})
					}),
					failed > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "px-4 py-3 text-xs text-muted",
						children: [
							"خواندن ",
							failed,
							" سری کندل ناموفق بود. یک بار دیگر اسکن کنید."
						]
					}) : null
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "chart-panel",
				className: "order-1 lg:order-2 lg:col-span-8 lg:min-h-0 lg:overflow-y-auto xl:col-span-9",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "border-b border-line px-4 py-4 lg:px-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
						className: "rounded-md border border-line bg-surface",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
							className: "cursor-pointer list-none px-4 py-3 text-sm font-medium",
							children: "قوانین سیگنال"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
							className: "space-y-2 border-t border-line px-4 py-3 text-sm leading-relaxed text-muted",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "صد ارز پرمعامله اسپات تتر، روی ۱ ساعته، ۴ ساعته و روزانه. فقط ۶۰ کندل بسته‌شده آخر." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "سوینگ های و سوینگ لو با فراکتال دو کندل از هر طرف تأیید می‌شوند. خط سقف بالاترین سوینگ های است و خط کف پایین‌ترین سوینگ لو." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "ناحیه تنش دور هر خط، ۰.۳۵ برابر ATR ۱۴ است و از ۰.۲۵٪ قیمت باریک‌تر نمی‌شود. کندل آخر باید داخل این ناحیه باشد." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "پولبک یعنی بعد از سوینگ، قیمت حداقل ۰.۸٪ از سطح دور شده و برگشته باشد. سوینگی که تازه ساخته شده سیگنال نمی‌دهد." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "اکستنشن و کارکشن از سوینگ‌های پشت‌سرهم ساخته می‌شوند و هر کدام باید حداقل ۴ کندل باشند. حداقل یک اکستنشن و دو کارکشن لازم است." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "در ساختار صعودی موج بالا اکستنشن است و موج پایین کارکشن. در ساختار نزولی برعکس. آخرین کارکشن باید از کارکشن قبلی درصد بزرگ‌تری داشته باشد." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "کندل تغییر جریان سفارشات باید در چهار کندل آخر و کنار سطح زده شده باشد: کلوز از سقف یا کف کندل قبل عبور کند، یا پین ریجکشن، یا اینگالف بدنه." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "رسیدن به سوینگ لو سیگنال خرید است و رسیدن به سوینگ های سیگنال فروش. دیده‌بان یعنی قیمت در ناحیه است ولی یکی دو قانون هنوز جا مانده." })
							]
						})]
					})
				}), !active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "px-4 py-16 text-sm text-muted lg:px-6",
					children: phase === "ready" ? "هیچ ستاپی با فیلتر فعلی در ناحیه تنش نیست." : "نمودار بعد از پیدا شدن اولین ستاپ اینجا می‌آید."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "px-4 py-4 lg:px-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 flex flex-wrap items-end justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "text-xl font-semibold",
								children: [active.base, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ms-2 text-sm font-normal text-muted",
									children: intervalLabel(active.interval)
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 max-w-3xl text-sm leading-relaxed text-muted",
								children: setupSentence(active)
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-end",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-lg font-semibold tabular-nums",
									children: formatPrice(active.lastPrice)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: active.changePct >= 0 ? "text-sm text-buy tabular-nums" : "text-sm text-sell tabular-nums",
									children: ["۲۴ ساعت ", formatPct(active.changePct)]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "overflow-hidden rounded-md border border-line bg-canvas",
							children: [chart.status === "ready" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CandleChart, {
								candles: chart.candles,
								analysis: chart.analysis,
								interval: active.interval
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex h-72 items-center justify-center text-sm text-muted lg:h-96",
								children: chart.status === "error" ? chart.message : "در حال چیدن ۶۰ کندل و خط‌های سوینگ…"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-3 py-2 text-xs text-muted",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-block h-0.5 w-4 bg-sell" }), " سوینگ های"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-block h-0.5 w-4 bg-buy" }), " سوینگ لو"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-block h-0.5 w-4 bg-buy" }), " اکستنشن"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-block h-px w-4 border-t border-dashed border-accent" }), " کارکشن"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-block size-2 bg-accent" }), " کندل جریان"]
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "سوینگ های",
									value: formatPrice(active.swingHigh)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "سوینگ لو",
									value: formatPrice(active.swingLow)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "فاصله تا سطح",
									value: active.distancePct == null ? "—" : formatPlainPct(active.distancePct)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "ساختار",
									value: active.bias === "up" ? "صعودی" : active.bias === "down" ? "نزولی" : "—"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 divide-y divide-line rounded-md border border-line",
							children: (chart.status === "ready" ? ruleChecks(chart.analysis.reasons) : ruleChecks(active.reasons)).map((check) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center justify-between gap-3 px-3 py-2 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: check.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: check.pass ? "text-buy" : "text-sell",
									children: check.pass ? "بله" : "نه"
								})]
							}, check.id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-4 text-xs leading-relaxed text-muted",
							children: ["زمان کندل‌ها به وقت تهران است. داده از بازار اسپات است و سیگنال فقط خروجی این قوانین است، نه توصیه خرید یا فروش.", scannedAt ? ` آخرین اسکن: ${new Intl.DateTimeFormat("fa-IR", {
								timeZone: "Asia/Tehran",
								hour: "2-digit",
								minute: "2-digit"
							}).format(scannedAt)}.` : ""]
						})
					]
				})]
			})]
		})]
	});
}
function Logo() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 32 32",
		className: "size-10 shrink-0",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				width: "32",
				height: "32",
				rx: "8",
				className: "fill-surface-2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M7 23h18",
				className: "stroke-buy",
				strokeWidth: "1.8"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M7 9h18",
				className: "stroke-sell",
				strokeWidth: "1.8"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M8 18l4-5 4 4 4-7 4 5",
				className: "stroke-accent",
				fill: "none",
				strokeWidth: "1.6"
			})
		]
	});
}
function Chip({ active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-pressed": active,
		onClick,
		className: "h-11 rounded-md px-3 text-sm " + (active ? "bg-accent text-ink" : "bg-surface text-fg ring-1 ring-line"),
		children
	});
}
function Stat({ label, value, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex items-center gap-1 rounded-sm bg-surface px-2 py-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: tone === "accent" ? "font-semibold text-accent tabular-nums" : "font-semibold tabular-nums",
			children: value
		})]
	});
}
function SideBadge({ side, status }) {
	if (!side) return null;
	const signal = status === "signal";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "rounded-sm px-1.5 py-0.5 text-xs font-medium " + (side === "buy" ? signal ? "bg-buy text-ink" : "text-buy ring-1 ring-buy" : signal ? "bg-sell text-ink" : "text-sell ring-1 ring-sell"),
		children: signal ? sideLabel(side) : `دیده‌بان ${sideLabel(side)}`
	});
}
function Metric({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md border border-line bg-surface px-3 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-xs text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 text-sm font-medium tabular-nums",
			children: value
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scanner, {});
}
//#endregion
export { Home as component };
