import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, _ as createFileRoute, b as require_jsx_runtime, d as Scripts, f as HeadContent, g as lazyRouteComponent, h as Outlet, m as createRouter, v as createRootRoute, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as object, i as number, n as array, o as string, r as literal, s as union, t as _enum } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-B1c1_mrk.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* Path-based preview hosts serve the dev server under `/{port_id}/` and strip
* that prefix before forwarding, so SSR sees `/` while the browser URL keeps the
* prefix. TanStack Start resets `basepath` on hydration, so a `rewrite` keeps
* client routing and generated links aligned with the public URL.
*/
var PATH_BASED_PREVIEW_HOSTS = /* @__PURE__ */ new Set([
	"preview.grok.genai.mil",
	"preview.grok.mil",
	"preview.grokgsac.com"
]);
var PORT_ID_PREFIX = /^\/hds-[a-z0-9]+-\d+-[a-z0-9]+(?=\/|$)/i;
function previewPathPrefix(hostname, pathname) {
	if (!PATH_BASED_PREVIEW_HOSTS.has(hostname.toLowerCase())) return void 0;
	return PORT_ID_PREFIX.exec(pathname)?.[0];
}
function prefixRewrite(prefix) {
	return {
		input: ({ url }) => {
			if (url.pathname === prefix) url.pathname = "/";
			else if (url.pathname.startsWith(`${prefix}/`)) url.pathname = url.pathname.slice(prefix.length);
			return url;
		},
		output: ({ url }) => {
			url.pathname = `${prefix}${url.pathname}`;
			return url;
		}
	};
}
function previewPathRewrite() {
	if (typeof window === "undefined") return void 0;
	const prefix = previewPathPrefix(window.location.hostname, window.location.pathname);
	return prefix ? prefixRewrite(prefix) : void 0;
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var styles_default = "/assets/styles-CLlPT2wJ.css";
var APP_NAME = "کشش";
var Route$4 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "اسکنر سوینگ ۱۰۰ ارز روی تایم‌فریم ۱ ساعته، ۴ ساعته و روزانه"
			},
			{
				name: "theme-color",
				content: "#101418"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "fa",
		dir: "rtl",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
var $$splitComponentImporter = () => import("./routes-Z2qWPt9N.mjs");
var Route$3 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var PIVOT = 2;
var MIN_LEG = 4;
var REASON_TEXT = {
	"no-swings": "سوینگ های یا سوینگ لو تأییدشده در ۶۰ کندل کافی نیست",
	"not-near": "کندل آخر در ناحیه تنش سطح نیست",
	"no-pullback": "پولبک کامل نیست؛ قیمت هنوز از سطح فاصله نگرفته و برنگشته",
	"short-waves": "اکستنشن یا کارکشن کمتر از ۴ کندل است یا دو اصلاح کامل نداریم",
	"correction-not-larger": "آخرین اصلاح از اصلاح قبلی بزرگ‌تر نشده",
	"no-orderflow": "کندل تغییر جریان سفارشات زده نشده"
};
function reasonLabel(reason) {
	return REASON_TEXT[reason];
}
function intervalLabel(interval) {
	if (interval === "1h") return "۱ ساعته";
	if (interval === "4h") return "۴ ساعته";
	return "روزانه";
}
function intervalMs(interval) {
	if (interval === "1h") return 36e5;
	if (interval === "4h") return 144e5;
	return 864e5;
}
/** Drop the still-forming candle so signals only use closed bars. */
function closedCandles(raw, interval, now = Date.now()) {
	const ms = intervalMs(interval);
	return raw.filter((c) => c.time + ms <= now).slice(-60);
}
function atr14(candles) {
	if (candles.length < 2) return 0;
	const trs = [];
	for (let i = 1; i < candles.length; i++) {
		const prev = candles[i - 1];
		const c = candles[i];
		trs.push(Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close)));
	}
	const n = Math.min(14, trs.length);
	let acc = 0;
	for (let i = 0; i < n; i++) acc += trs[i];
	let value = acc / n;
	for (let i = n; i < trs.length; i++) value = (value * (n - 1) + trs[i]) / n;
	return value;
}
function isSwingHigh(candles, i) {
	const h = candles[i].high;
	for (let j = 1; j <= PIVOT; j++) if (h <= candles[i - j].high || h <= candles[i + j].high) return false;
	return true;
}
function isSwingLow(candles, i) {
	const l = candles[i].low;
	for (let j = 1; j <= PIVOT; j++) if (l >= candles[i - j].low || l >= candles[i + j].low) return false;
	return true;
}
function findPivots(candles) {
	const out = [];
	for (let i = PIVOT; i < candles.length - PIVOT; i++) {
		const high = isSwingHigh(candles, i);
		if (high === isSwingLow(candles, i)) continue;
		const kind = high ? "high" : "low";
		out.push({
			index: i,
			time: candles[i].time,
			price: high ? candles[i].high : candles[i].low,
			kind
		});
	}
	return out;
}
function rangePct(from, to) {
	if (from === 0) return 0;
	return Math.abs(to - from) / Math.abs(from) * 100;
}
/**
* Alternate significant swings. Same-kind prints keep the more extreme one.
* A turn is kept only when it is at least MIN_LEG bars away — each wave is
* four candles or longer.
*/
function zigzag(pivots) {
	const seq = [];
	for (const p of pivots) {
		const last = seq[seq.length - 1];
		if (!last) {
			seq.push(p);
			continue;
		}
		if (p.kind === last.kind) {
			if (p.kind === "high" ? p.price >= last.price : p.price <= last.price) seq[seq.length - 1] = p;
			continue;
		}
		if (p.index - last.index < MIN_LEG) continue;
		seq.push(p);
	}
	return seq;
}
function pushLeg(legs, from, toIndex, toPrice, bias, provisional) {
	const candles = toIndex - from.index;
	if (candles < MIN_LEG) return;
	const direction = toPrice >= from.price ? "up" : "down";
	const role = bias === "up" && direction === "up" || bias === "down" && direction === "down" ? "extension" : "correction";
	legs.push({
		from: from.index,
		to: toIndex,
		fromPrice: from.price,
		toPrice,
		direction,
		candles,
		rangePct: rangePct(from.price, toPrice),
		role,
		provisional
	});
}
function buildLegs(candles, seq, bias) {
	const legs = [];
	for (let i = 1; i < seq.length; i++) {
		const a = seq[i - 1];
		const b = seq[i];
		pushLeg(legs, a, b.index, b.price, bias, false);
	}
	const last = seq[seq.length - 1];
	if (!last || candles.length - 1 - last.index < MIN_LEG) return legs;
	const tail = candles.slice(last.index);
	let extremePrice = last.kind === "high" ? Infinity : -Infinity;
	let extremeOffset = 0;
	tail.forEach((c, offset) => {
		const price = last.kind === "high" ? c.low : c.high;
		if (last.kind === "high" ? price < extremePrice : price > extremePrice) {
			extremePrice = price;
			extremeOffset = offset;
		}
	});
	pushLeg(legs, last, last.index + extremeOffset, extremePrice, bias, true);
	return legs;
}
function bodyRatio(c) {
	const range = c.high - c.low;
	if (range <= 0) return 0;
	return Math.abs(c.close - c.open) / range;
}
function lowerWickRatio(c) {
	const range = c.high - c.low;
	if (range <= 0) return 0;
	return (Math.min(c.open, c.close) - c.low) / range;
}
function upperWickRatio(c) {
	const range = c.high - c.low;
	if (range <= 0) return 0;
	return (c.high - Math.max(c.open, c.close)) / range;
}
function closeLocation(c) {
	const range = c.high - c.low;
	if (range <= 0) return .5;
	return (c.close - c.low) / range;
}
function engulfs(c, prev, side) {
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
function findOrderFlow(candles, side, level, zone) {
	const start = Math.max(1, candles.length - 4);
	for (let i = candles.length - 1; i >= start; i--) {
		const c = candles[i];
		const prev = candles[i - 1];
		if (!(side === "buy" ? c.low <= level + zone * 2.6 || prev.low <= level + zone * 2.6 : c.high >= level - zone * 2.6 || prev.high >= level - zone * 2.6)) continue;
		if (side === "buy") {
			const broke = c.close > c.open && c.close > prev.high && bodyRatio(c) >= .35;
			const pin = c.close > c.open && lowerWickRatio(c) >= .4 && closeLocation(c) >= .62 && bodyRatio(c) >= .18;
			if (broke || pin || c.close > c.open && engulfs(c, prev, "buy") && bodyRatio(c) >= .35) return i;
		} else {
			const broke = c.close < c.open && c.close < prev.low && bodyRatio(c) >= .35;
			const pin = c.close < c.open && upperWickRatio(c) >= .4 && closeLocation(c) <= .38 && bodyRatio(c) >= .18;
			if (broke || pin || c.close < c.open && engulfs(c, prev, "sell") && bodyRatio(c) >= .35) return i;
		}
	}
	return null;
}
function movedAway(candles, swingIndex, level, side, need) {
	if (candles.length - 1 - swingIndex < 6) return false;
	const mid = candles.slice(swingIndex + 1, candles.length - 1);
	if (mid.length === 0) return false;
	if (side === "buy") return Math.max(...mid.map((c) => c.close)) >= level + need;
	return Math.min(...mid.map((c) => c.close)) <= level - need;
}
function nearNow(candle, level, zone, side) {
	if (side === "buy") return candle.low <= level + zone && candle.close <= level + zone * 2 && candle.close >= level - zone * .8;
	return candle.high >= level - zone && candle.close >= level - zone * 2 && candle.close <= level + zone * .8;
}
function analyze(candles) {
	const empty = {
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
		bias: null
	};
	if (candles.length < 20) return empty;
	const pivots = findPivots(candles);
	const highs = pivots.filter((p) => p.kind === "high");
	const lows = pivots.filter((p) => p.kind === "low");
	if (highs.length === 0 || lows.length === 0) return empty;
	const swingHigh = highs.reduce((a, b) => b.price > a.price || b.price === a.price && b.index > a.index ? b : a);
	const swingLow = lows.reduce((a, b) => b.price < a.price || b.price === a.price && b.index > a.index ? b : a);
	const bias = swingLow.index <= swingHigh.index ? "up" : "down";
	const seq = zigzag(pivots);
	const legs = seq.length >= 2 ? buildLegs(candles, seq, bias) : [];
	const atr = atr14(candles);
	const last = candles[candles.length - 1];
	const zone = Math.max(atr * .35, last.close * .0025);
	const corrections = legs.filter((l) => l.role === "correction").map((l) => ({
		rangePct: l.rangePct,
		candles: l.candles
	}));
	const candidateSides = [];
	if (nearNow(last, swingLow.price, zone, "buy")) candidateSides.push("buy");
	if (nearNow(last, swingHigh.price, zone, "sell")) candidateSides.push("sell");
	if (candidateSides.length === 0) {
		const closer = Math.abs(last.close - swingLow.price) / swingLow.price <= Math.abs(last.close - swingHigh.price) / swingHigh.price ? swingLow.price : swingHigh.price;
		return {
			status: "none",
			side: null,
			reasons: ["not-near"],
			swingHigh,
			swingLow,
			zone,
			atr,
			distancePct: Math.abs(last.close - closer) / closer * 100,
			legs,
			corrections,
			orderFlowIndex: null,
			bias
		};
	}
	const side = candidateSides.length === 1 ? candidateSides[0] : Math.abs(last.close - swingLow.price) <= Math.abs(last.close - swingHigh.price) ? "buy" : "sell";
	const level = side === "buy" ? swingLow : swingHigh;
	const needAway = Math.max(level.price * .008, zone * 2.5);
	const reasons = [];
	if (!movedAway(candles, level.index, level.price, side, needAway)) reasons.push("no-pullback");
	const corr = legs.filter((l) => l.role === "correction");
	if (!(legs.filter((l) => l.role === "extension").length >= 1 && corr.length >= 2 && legs.every((l) => l.candles >= MIN_LEG))) reasons.push("short-waves");
	else if (corr[corr.length - 1].rangePct <= corr[corr.length - 2].rangePct) reasons.push("correction-not-larger");
	const orderFlowIndex = findOrderFlow(candles, side, level.price, zone);
	if (orderFlowIndex == null) reasons.push("no-orderflow");
	const distancePct = Math.abs(last.close - level.price) / level.price * 100;
	const watchReasons = reasons.filter((r) => r !== "not-near");
	let status = "none";
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
		bias
	};
}
function summarize(symbol, interval, candles) {
	if (candles.length < 60) return null;
	const a = analyze(candles);
	if (!a.swingHigh || !a.swingLow) return null;
	const last = candles[candles.length - 1];
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
		lastCorrectionPct: corr.length ? corr[corr.length - 1].rangePct : null,
		prevCorrectionPct: corr.length >= 2 ? corr[corr.length - 2].rangePct : null,
		zonePct: last.close ? a.zone / last.close * 100 : 0,
		bias: a.bias,
		orderFlowTime: a.orderFlowIndex != null ? candles[a.orderFlowIndex].time : null
	};
}
var HOST = "https://data-api.binance.vision";
var STABLES = /* @__PURE__ */ new Set([
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
	"BFUSD"
]);
/** Crypto bases that legitimately end in B. Everything else *B is a stock token. */
var CRYPTO_ENDING_B = /* @__PURE__ */ new Set([
	"BNB",
	"ARB",
	"SHIB",
	"1000SHIB",
	"TRB",
	"CKB",
	"DGB",
	"BB",
	"VIB",
	"PHB"
]);
var cache = /* @__PURE__ */ new Map();
async function binanceGet(path, ttlMs) {
	const hit = cache.get(path);
	if (hit && hit.exp > Date.now()) return hit.body;
	let lastError;
	for (let attempt = 0; attempt < 3; attempt++) try {
		const res = await fetch(`${HOST}${path}`, { headers: { accept: "application/json" } });
		if (res.status === 429 || res.status === 418) {
			await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
			continue;
		}
		if (!res.ok) throw new Error(`binance ${res.status}`);
		const body = await res.json();
		cache.set(path, {
			exp: Date.now() + ttlMs,
			body
		});
		return body;
	} catch (error) {
		lastError = error;
		await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
	}
	throw lastError instanceof Error ? lastError : /* @__PURE__ */ new Error("binance unavailable");
}
function tradableBase(base) {
	if (STABLES.has(base) || base.includes("USD")) return false;
	if (/(UP|DOWN|BULL|BEAR)$/.test(base)) return false;
	if (base.endsWith("B") && !CRYPTO_ENDING_B.has(base)) return false;
	return /^[A-Z0-9]{2,15}$/.test(base);
}
async function loadUniverse() {
	return (await binanceGet("/api/v3/ticker/24hr", 6e4)).filter((row) => row.symbol.endsWith("USDT") && tradableBase(row.symbol.slice(0, -4))).sort((a, b) => Number(b.quoteVolume) - Number(a.quoteVolume)).slice(0, 100).map((row) => ({
		symbol: row.symbol,
		base: row.symbol.slice(0, -4),
		lastPrice: Number(row.lastPrice),
		changePct: Number(row.priceChangePercent),
		quoteVolume: Number(row.quoteVolume)
	}));
}
function parseKlines(raw) {
	if (!Array.isArray(raw)) return [];
	const candles = [];
	for (const row of raw) {
		if (!Array.isArray(row) || row.length < 6) continue;
		const candle = {
			time: Number(row[0]),
			open: Number(row[1]),
			high: Number(row[2]),
			low: Number(row[3]),
			close: Number(row[4]),
			volume: Number(row[5])
		};
		if ([
			candle.time,
			candle.open,
			candle.high,
			candle.low,
			candle.close
		].every(Number.isFinite)) candles.push(candle);
	}
	return candles;
}
async function klines(symbol, interval) {
	return closedCandles(parseKlines(await binanceGet(`/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=61`, 45e3)), interval);
}
async function mapPool(items, limit, fn) {
	const out = new Array(items.length);
	let cursor = 0;
	const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (cursor < items.length) {
			const index = cursor++;
			out[index] = await fn(items[index]);
		}
	});
	await Promise.all(workers);
	return out;
}
async function scanSymbols(symbols, intervals) {
	const jobs = symbols.flatMap((symbol) => intervals.map((interval) => ({
		symbol,
		interval
	})));
	const failed = [];
	const rows = [];
	await mapPool(jobs, 8, async (job) => {
		try {
			const candles = await klines(job.symbol, job.interval);
			const summary = summarize(job.symbol, job.interval, candles);
			if (summary && summary.status !== "none") rows.push(summary);
		} catch {
			failed.push(`${job.symbol}:${job.interval}`);
		}
	});
	return {
		rows,
		failed,
		scanned: jobs.length
	};
}
async function loadChart(symbol, interval) {
	const candles = await klines(symbol, interval);
	return {
		symbol,
		interval,
		candles,
		analysis: analyze(candles)
	};
}
var querySchema = object({
	symbol: string().regex(/^[A-Z0-9]{2,16}USDT$/),
	interval: _enum([
		"1h",
		"4h",
		"1d"
	])
});
var Route$2 = createFileRoute("/api/chart")({ server: { handlers: { GET: async ({ request }) => {
	const url = new URL(request.url);
	const parsed = querySchema.safeParse({
		symbol: url.searchParams.get("symbol"),
		interval: url.searchParams.get("interval")
	});
	if (!parsed.success) return Response.json({ error: "invalid query" }, { status: 400 });
	try {
		const chart = await loadChart(parsed.data.symbol, parsed.data.interval);
		return Response.json(chart);
	} catch (error) {
		const message = error instanceof Error ? error.message : "chart failed";
		return Response.json({ error: message }, { status: 502 });
	}
} } } });
var bodySchema = object({
	symbols: array(string().regex(/^[A-Z0-9]{2,16}USDT$/)).min(1).max(16),
	intervals: array(_enum([
		"1h",
		"4h",
		"1d"
	])).min(1).max(3)
});
var Route$1 = createFileRoute("/api/scan")({ server: { handlers: { POST: async ({ request }) => {
	let json;
	try {
		json = await request.json();
	} catch {
		return Response.json({ error: "invalid JSON" }, { status: 400 });
	}
	const parsed = bodySchema.safeParse(json);
	if (!parsed.success) return Response.json({ error: "invalid request" }, { status: 400 });
	try {
		const result = await scanSymbols(parsed.data.symbols, parsed.data.intervals);
		return Response.json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : "scan failed";
		return Response.json({ error: message }, { status: 502 });
	}
} } } });
var Route = createFileRoute("/api/universe")({ server: { handlers: { GET: async () => {
	try {
		const symbols = await loadUniverse();
		return Response.json({ symbols });
	} catch (error) {
		const message = error instanceof Error ? error.message : "universe failed";
		return Response.json({ error: message }, { status: 502 });
	}
} } } });
var rootRouteChildren = {
	IndexRoute: Route$3.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$4
	}),
	ApiChartRoute: Route$2.update({
		id: "/api/chart",
		path: "/api/chart",
		getParentRoute: () => Route$4
	}),
	ApiScanRoute: Route$1.update({
		id: "/api/scan",
		path: "/api/scan",
		getParentRoute: () => Route$4
	}),
	ApiUniverseRoute: Route.update({
		id: "/api/universe",
		path: "/api/universe",
		getParentRoute: () => Route$4
	})
};
var routeTree = Route$4._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		rewrite: previewPathRewrite(),
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { intervalLabel as n, reasonLabel as r, router_exports as t };
