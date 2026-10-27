import { createFileRoute } from "@tanstack/react-router";
import { loadUniverse } from "@/lib/market/binance.server";

export const Route = createFileRoute("/api/universe")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const symbols = await loadUniverse();
          return Response.json({ symbols });
        } catch (error) {
          const message = error instanceof Error ? error.message : "universe failed";
          return Response.json({ error: message }, { status: 502 });
        }
      },
    },
  },
});
