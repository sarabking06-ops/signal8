import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { loadChart } from "@/lib/market/binance.server";

const querySchema = z.object({
  symbol: z.string().regex(/^[A-Z0-9]{2,16}USDT$/),
  interval: z.enum(["1h", "4h", "1d"]),
});

export const Route = createFileRoute("/api/chart")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const parsed = querySchema.safeParse({
          symbol: url.searchParams.get("symbol"),
          interval: url.searchParams.get("interval"),
        });
        if (!parsed.success) return Response.json({ error: "invalid query" }, { status: 400 });
        try {
          const chart = await loadChart(parsed.data.symbol, parsed.data.interval);
          return Response.json(chart);
        } catch (error) {
          const message = error instanceof Error ? error.message : "chart failed";
          return Response.json({ error: message }, { status: 502 });
        }
      },
    },
  },
});
