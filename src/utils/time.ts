export const nowIso = () => new Date().toISOString();

export function addHours(date: Date, hours: number): string {
  return new Date(date.getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function isExpired(iso: string): boolean {
  return Date.now() >= new Date(iso).getTime();
}
