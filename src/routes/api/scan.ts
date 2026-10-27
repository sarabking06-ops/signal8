import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { scanSymbols } from "@/lib/market/binance.server";

const bodySchema = z.object({
  symbols: z.array(z.string().regex(/^[A-Z0-9]{2,16}USDT$/)).min(1).max(16),
  intervals: z.array(z.enum(["1h", "4h", "1d"])).min(1).max(3),
});

export const Route = createFileRoute("/api/scan")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let json: unknown;
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
      },
    },
  },
});
