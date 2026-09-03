"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AUTH_CHANGED_EVENT, dispatchAuthChange } from "@/lib/auth-events";
import { clearAuth, getMe, login, setStoredUser, setToken } from "@/lib/api";
import {
  type DemoPersonas,
  type DemoRole,
  clearDemoMode,
  fetchDemoStatus,
  getDemoRole,
  requestDemoReset,
  setDemoRole,
} from "@/lib/demo";

type Busy = "" | "switch" | "reset";

export default function DemoModeBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<DemoRole | null>(null);
  const [personas, setPersonas] = useState<DemoPersonas | null>(null);
  const [busy, setBusy] = useState<Busy>("");
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    const currentRole = getDemoRole();
    if (!currentRole) {
      setRole(null);
      return;
    }
    try {
      const status = await fetchDemoStatus();
      setPersonas(status.personas);
      setRole(currentRole);
    } catch {
      // Backend no longer running in demo mode — drop the stale flag quietly.
      setRole(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, pathname]);

  useEffect(() => {
    function onAuthChange() {
      refresh();
    }
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChange);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChange);
  }, [refresh]);

  async function loginAsPersona(nextRole: DemoRole, source: DemoPersonas) {
    const persona = source[nextRole];
    const data = await login(persona.email, persona.password);
    setToken(data.access_token);
    const me = await getMe();
    setStoredUser(me);
    setDemoRole(nextRole);
    dispatchAuthChange();
    setRole(nextRole);
  }

  async function handleSwitch() {
    if (!role || !personas) return;
    setBusy("switch");
    setMessage("");
    try {
      await loginAsPersona(role === "buyer" ? "seller" : "buyer", personas);
      router.push("/");
      router.refresh();
    } catch {
      setMessage("No se pudo cambiar de identidad demo.");
    } finally {
      setBusy("");
    }
  }

  async function handleReset() {
    if (!role) return;
    setBusy("reset");
    setMessage("");
    try {
      await requestDemoReset();
      const status = await fetchDemoStatus();
      setPersonas(status.personas);
      await loginAsPersona(role, status.personas);
      setMessage("Demo reiniciada.");
      router.push("/");
      router.refresh();
    } catch {
      setMessage("No se pudo reiniciar la demo.");
    } finally {
      setBusy("");
    }
  }

  function handleExit() {
    clearAuth();
    clearDemoMode();
    dispatchAuthChange();
    setRole(null);
    router.push("/");
    router.refresh();
  }

  if (!role || !personas) return null;

  const current = personas[role];
  const other = personas[role === "buyer" ? "seller" : "buyer"];
  const disabled = busy !== "";

  return (
    <div
      data-testid="demo-bar"
      className="sticky top-0 z-40 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-b border-accent/30 bg-accent/10 px-4 py-2 text-xs sm:text-sm"
    >
      <span className="font-bold uppercase tracking-[0.14em] text-accent">
        Demo Mode
      </span>
      <span data-testid="demo-bar-identity" className="font-medium text-foreground">
        {current.label} · {current.name}
      </span>
      <button
        type="button"
        data-testid="demo-bar-switch"
        disabled={disabled}
        onClick={handleSwitch}
        className="font-semibold text-accent underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy === "switch" ? "Cambiando…" : `Cambiar a ${other.label}`}
      </button>
      <button
        type="button"
        data-testid="demo-bar-reset"
        disabled={disabled}
        onClick={handleReset}
        className="font-semibold text-accent underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy === "reset" ? "Reiniciando…" : "Reset Demo"}
      </button>
      <button
        type="button"
        data-testid="demo-bar-exit"
        disabled={disabled}
        onClick={handleExit}
        className="font-semibold text-muted-foreground underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
      >
        Salir de Demo
      </button>
      {message && (
        <span data-testid="demo-bar-message" className="text-muted-foreground">
          {message}
        </span>
      )}
    </div>
  );
}
