"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { dispatchAuthChange } from "@/lib/auth-events";
import { getMe, login, setStoredUser, setToken } from "@/lib/api";
import {
  type DemoPersonas,
  type DemoRole,
  fetchDemoStatus,
  requestDemoReset,
  setDemoRole,
} from "@/lib/demo";

function formatError(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  return "No se pudo iniciar el modo demo.";
}

export default function DemoEntryPage() {
  const router = useRouter();
  const [personas, setPersonas] = useState<DemoPersonas | null>(null);
  const [statusError, setStatusError] = useState("");
  const [actionError, setActionError] = useState("");
  const [loadingRole, setLoadingRole] = useState<DemoRole | "">("");

  useEffect(() => {
    fetchDemoStatus()
      .then((status) => setPersonas(status.personas))
      .catch(() =>
        setStatusError(
          "Demo mode no está habilitado en este backend. " +
            "Define MELOMANOS_DEMO_MODE=1 (o APP_ENV=local) y reinicia la API.",
        ),
      );
  }, []);

  async function loginAsPersona(role: DemoRole, source: DemoPersonas) {
    const persona = source[role];
    const data = await login(persona.email, persona.password);
    setToken(data.access_token);
    const me = await getMe();
    setStoredUser(me);
    setDemoRole(role);
    dispatchAuthChange();
  }

  async function enterAs(role: DemoRole) {
    if (!personas) return;
    setLoadingRole(role);
    setActionError("");
    try {
      try {
        await loginAsPersona(role, personas);
      } catch {
        // First run (or after a manual DB wipe): the demo scenario isn't
        // seeded yet — restore it once, then retry the same login.
        await requestDemoReset();
        await loginAsPersona(role, personas);
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setActionError(formatError(err));
    } finally {
      setLoadingRole("");
    }
  }

  const busy = loadingRole !== "";

  return (
    <div
      data-testid="demo-entry-page"
      className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center sm:py-20"
    >
      <p className="editorial-label text-accent">Modo Demo</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Revisar Melómanos Market
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Entra con una identidad de prueba ya preparada — catálogo, órdenes y
        mensajes de ejemplo incluidos. No necesitas registrarte ni recordar
        contraseñas.
      </p>

      {statusError && (
        <p
          data-testid="demo-status-error"
          role="alert"
          className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {statusError}
        </p>
      )}

      {actionError && (
        <p
          data-testid="demo-action-error"
          role="alert"
          className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {actionError}
        </p>
      )}

      {personas && (
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
          <button
            type="button"
            data-testid="demo-enter-buyer"
            disabled={busy}
            onClick={() => enterAs("buyer")}
            className="btn-primary px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingRole === "buyer"
              ? "Entrando…"
              : `Entrar como ${personas.buyer.label}`}
          </button>
          <button
            type="button"
            data-testid="demo-enter-seller"
            disabled={busy}
            onClick={() => enterAs("seller")}
            className="btn-ghost px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingRole === "seller"
              ? "Entrando…"
              : `Entrar como ${personas.seller.label}`}
          </button>
        </div>
      )}
    </div>
  );
}
