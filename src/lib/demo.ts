import { API_BASE } from "@/lib/api";

export type DemoRole = "buyer" | "seller";

export interface DemoPersona {
  role: DemoRole;
  label: string;
  email: string;
  password: string;
  name: string;
}

export interface DemoPersonas {
  buyer: DemoPersona;
  seller: DemoPersona;
}

export interface DemoStatus {
  demo_mode_enabled: boolean;
  seed_size: string;
  personas: DemoPersonas;
}

const DEMO_ROLE_KEY = "melomanos_demo_role";

export async function fetchDemoStatus(): Promise<DemoStatus> {
  const res = await fetch(`${API_BASE}/demo/status`, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Demo mode no disponible (${res.status})`);
  }
  return (await res.json()) as DemoStatus;
}

export async function requestDemoReset(): Promise<void> {
  const res = await fetch(`${API_BASE}/demo/reset`, { method: "POST" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `No se pudo reiniciar la demo (${res.status})`);
  }
}

/** Which demo persona the browser is currently acting as (or null outside demo mode). */
export function getDemoRole(): DemoRole | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(DEMO_ROLE_KEY);
  return value === "buyer" || value === "seller" ? value : null;
}

export function setDemoRole(role: DemoRole): void {
  localStorage.setItem(DEMO_ROLE_KEY, role);
}

export function clearDemoMode(): void {
  localStorage.removeItem(DEMO_ROLE_KEY);
}
