import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { eventBus } from "../lib/event-bus-instance";
import { getDashboardData } from "../services/dashboard-data-aggregator";
import { logger } from "../lib/logger-instance";
import type { DashboardResponse, SignalEvent } from "@crowdpulse/shared";

const MAX_SSE_CONNECTIONS = 100;
let activeConnections = 0;

const sseRoutes = new Hono();

/** GET /api/sse/dashboard — push live dashboard updates via Server-Sent Events */
sseRoutes.get("/sse/dashboard", (c) => {
  if (activeConnections >= MAX_SSE_CONNECTIONS) {
    return c.json({ error: "SSE connection limit reached" }, 503);
  }

  return streamSSE(c, async (stream) => {
    activeConnections++;
    logger.info({ activeConnections }, "SSE client connected");

    // Send initial snapshot immediately so client doesn't wait for next cycle
    try {
      const initial = await getDashboardData();
      await stream.writeSSE({
        event: "dashboard:update",
        data: JSON.stringify(initial),
      });
    } catch (err) {
      logger.warn({ err }, "Failed to send initial SSE snapshot");
    }

    // Listeners pushed onto the event bus for this connection
    const onDashboard = async (data: DashboardResponse) => {
      try {
        await stream.writeSSE({
          event: "dashboard:update",
          data: JSON.stringify(data),
        });
      } catch {
        // Client disconnected — cleanup handled below
      }
    };

    const onSignal = async (signal: SignalEvent) => {
      try {
        await stream.writeSSE({
          event: "signal:new",
          data: JSON.stringify(signal),
        });
      } catch {
        // Client disconnected
      }
    };

    eventBus.on("dashboard:update", onDashboard);
    eventBus.on("signal:new", onSignal);

    // Keep stream open until client disconnects
    stream.onAbort(() => {
      eventBus.off("dashboard:update", onDashboard);
      eventBus.off("signal:new", onSignal);
      activeConnections--;
      logger.info({ activeConnections }, "SSE client disconnected");
    });

    // Hold the stream open
    await stream.sleep(2_147_483_647);
  });
});

export { sseRoutes };
