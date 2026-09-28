export interface HubEvent { type: string; [key: string]: unknown }
type Listener = (event: HubEvent) => void;

export class EventHub {
  private listeners = new Map<string, Set<Listener>>();

  subscribe(sessionId: string, listener: Listener) {
    const set = this.listeners.get(sessionId) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(sessionId, set);
    return () => {
      set.delete(listener);
      if (set.size === 0) this.listeners.delete(sessionId);
    };
  }

  publish(sessionId: string, event: HubEvent) {
    this.listeners.get(sessionId)?.forEach((listener) => listener(event));
  }
}
