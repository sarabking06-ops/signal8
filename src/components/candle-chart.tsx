import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { Analysis, Candle, IntervalId } from "@/lib/market/analyze";
import { formatPrice, formatWhen } from "@/lib/market/format";

type Props = {
  candles: Candle[];
  analysis: Analysis;
  interval: IntervalId;
};

type Hover = { index: number; x: number; y: number };

function token(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function CandleChart({ candles, analysis, interval }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  useEffect(() => {
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

      const pad = { top: 16, right: 72, bottom: 22, left: 8 };
      const volumeH = Math.max(28, height * 0.16);
      const plot = {
        x: pad.left,
        y: pad.top,
        w: width - pad.left - pad.right,
        h: height - pad.top - pad.bottom - volumeH - 8,
      };
      const vol = { x: plot.x, y: plot.y + plot.h + 8, w: plot.w, h: volumeH };

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
        min = candles[0]!.low * 0.99;
        max = candles[0]!.high * 1.01;
      }
      const padPrice = (max - min) * 0.06;
      min -= padPrice;
      max += padPrice;

      const xAt = (index: number) => plot.x + ((index + 0.5) / candles.length) * plot.w;
      const yAt = (price: number) => plot.y + ((max - price) / (max - min)) * plot.h;
      const slot = plot.w / candles.length;
      const bodyW = Math.max(2.5, Math.min(10, slot * 0.62));

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
        const price = max - ((max - min) * i) / 4;
        const y = yAt(price);
        ctx.beginPath();
        ctx.moveTo(plot.x, y);
        ctx.lineTo(plot.x + plot.w, y);
        ctx.stroke();
        ctx.fillText(formatPrice(price), plot.x + plot.w + 8, y);
      }

      const zoneOf = (level: number, color: string) => {
        const y1 = yAt(level + analysis.zone);
        const y2 = yAt(level - analysis.zone);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.12;
        ctx.fillRect(plot.x, Math.min(y1, y2), plot.w, Math.abs(y2 - y1));
        ctx.globalAlpha = 1;
      };
      if (analysis.swingLow) zoneOf(analysis.swingLow.price, buy);
      if (analysis.swingHigh) zoneOf(analysis.swingHigh.price, sell);

      const maxVol = Math.max(...candles.map((c) => c.volume), 1);
      candles.forEach((candle, index) => {
        const x = xAt(index);
        const up = candle.close >= candle.open;
        const color = up ? buy : sell;
        const vh = (candle.volume / maxVol) * vol.h;
        ctx.globalAlpha = 0.45;
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

      const trace = (from: number, to: number, fromPrice: number, toPrice: number, color: string, dashed: boolean) => {
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
        const color = leg.role === "extension" ? (leg.direction === "up" ? buy : sell) : accent;
        trace(leg.from, leg.to, leg.fromPrice, leg.toPrice, color, leg.role === "correction");
      }

      const hLine = (price: number, color: string, label: string, yShift: number) => {
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
        ctx.globalAlpha = 0.9;
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
        const index = Math.round(((candles.length - 1) * i) / (ticks - 1));
        const candle = candles[index];
        if (!candle) continue;
        ctx.fillText(formatWhen(candle.time, interval), xAt(index), height - 6);
      }

      if (hover) {
        const candle = candles[hover.index];
        if (candle) {
          const x = xAt(hover.index);
          ctx.strokeStyle = fg;
          ctx.globalAlpha = 0.35;
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

    void document.fonts.ready.then(draw);
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [candles, analysis, interval, hover]);

  const onPointer = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const plotX = 8;
    const plotW = rect.width - 8 - 72;
    const ratio = (x - plotX) / plotW;
    const index = Math.min(candles.length - 1, Math.max(0, Math.floor(ratio * candles.length)));
    setHover({ index, x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  const hovered = hover ? candles[hover.index] : null;

  return (
    <div className="relative">
      <div ref={wrapRef} className="h-72 w-full lg:h-96">
        <canvas
          ref={canvasRef}
          className="h-full w-full touch-pan-y"
          onPointerMove={onPointer}
          onPointerLeave={() => setHover(null)}
        />
      </div>
      {hovered ? (
        <div className="pointer-events-none absolute top-2 left-2 rounded-sm bg-surface px-2 py-1 text-xs text-fg tabular-nums">
          <span className="text-muted">{formatWhen(hovered.time, interval)}</span>
          <span className="ms-2">O {formatPrice(hovered.open)}</span>
          <span className="ms-2">H {formatPrice(hovered.high)}</span>
          <span className="ms-2">L {formatPrice(hovered.low)}</span>
          <span className="ms-2">C {formatPrice(hovered.close)}</span>
        </div>
      ) : null}
    </div>
  );
}
