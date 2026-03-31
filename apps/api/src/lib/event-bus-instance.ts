import { EventEmitter } from "events";
import type { DashboardResponse, SignalEvent } from "@crowdpulse/shared";

export interface AlertTriggeredPayload {
  alertId: number;
  condition: string;
  threshold: number;
  actualValue: number;
  channel: string;
  telegramChatId?: string | null;
}

/** Typed in-memory event bus for inter-service communication */
class EventBus extends EventEmitter {
  emitDashboardUpdate(data: DashboardResponse): void {
    this.emit("dashboard:update", data);
  }

  emitNewSignal(signal: SignalEvent): void {
    this.emit("signal:new", signal);
  }

  emitAlert(alert: AlertTriggeredPayload): void {
    this.emit("alert:triggered", alert);
  }

  onDashboardUpdate(listener: (data: DashboardResponse) => void): this {
    return this.on("dashboard:update", listener);
  }

  onNewSignal(listener: (signal: SignalEvent) => void): this {
    return this.on("signal:new", listener);
  }

  onAlert(listener: (alert: AlertTriggeredPayload) => void): this {
    return this.on("alert:triggered", listener);
  }
}

// Singleton with raised listener cap: 100 SSE + Telegram + alerts + buffer
const eventBus = new EventBus();
eventBus.setMaxListeners(150);

export { eventBus };
