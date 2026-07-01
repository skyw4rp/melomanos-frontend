"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { dispatchAuthChange } from "@/lib/auth-events";
import { getMe, login, setStoredUser, setToken, API_BASE } from "@/lib/api";
import {
  getSafeRedirectPath,
  SESSION_EXPIRED_UI_MESSAGE,
} from "@/lib/auth-session";

function formatLoginError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message.trim();
    if (
      msg === "Failed to fetch" ||
      msg.toLowerCase().includes("networkerror") ||
      msg.toLowerCase().includes("network request failed")
    ) {
      return `No se pudo conectar con la API (${API_BASE}). Verifica que el backend esté corriendo (py run_melomanos.py --auto-migrate). Abre el frontend en http://localhost:3000 (no uses la URL de red del terminal).`;
    }
    if (msg.includes("401") || msg.toLowerCase().includes("incorrect")) {
      return "Email o contraseña incorrectos. Intenta de nuevo.";
    }
    if (msg.length > 0 && msg.length < 200) return msg;
  }
  return "No se pudo iniciar sesión. Verifica tus datos e intenta otra vez.";
}

const inputClass = "input-field";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const redirectAfterLogin = getSafeRedirectPath(nextParam) ?? "/";
  const sessionExpired = Boolean(nextParam && getSafeRedirectPath(nextParam));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const data = await login(email, password);
      setToken(data.access_token);

      const user = await getMe();
      setStoredUser(user);
      dispatchAuthChange();

      setSuccess(true);
      setTimeout(() => {
        router.push(redirectAfterLogin);
        router.refresh();
      }, 900);
    } catch (err) {
      setError(formatLoginError(err));
      setLoading(false);
    }
  }

  return (
    <div
      data-testid="login-page"
      className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16"
    >
      <div className="card-surface p-8 sm:p-10">
        <p className="editorial-label text-accent">Acceso coleccionistas</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Ingresa a Melómanos Market
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Guarda favoritos, conversa con vendedores y gestiona tus compras de
          vinilos.
        </p>

        {sessionExpired && (
          <p
            className="mt-4 rounded-xl border border-amber-600/25 bg-amber-600/10 px-4 py-3 text-sm text-amber-900"
            role="status"
          >
            {SESSION_EXPIRED_UI_MESSAGE}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="label-field">
              Correo electrónico
            </label>
            <input
              id="email"
              data-testid="login-email"
              type="email"
              autoComplete="email"
              required
              disabled={loading || success}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="label-field">
              Contraseña
            </label>
            <input
              id="password"
              data-testid="login-password"
              type="password"
              autoComplete="current-password"
              required
              disabled={loading || success}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && (
            <div
              className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}

          {success && (
            <p
              data-testid="login-success"
              className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
              role="status"
            >
              Sesión iniciada, redirigiendo…
            </p>
          )}

          <button
            type="submit"
            data-testid="login-submit"
            disabled={loading || success}
            className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Iniciando sesión…"
              : success
                ? "Redirigiendo…"
                : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link
            href="/"
            data-testid="login-back-link"
            className="font-medium text-muted-foreground transition hover:text-accent"
          >
            Volver al catálogo
          </Link>
        </p>
      </div>

      <aside
        data-testid="login-trust-note"
        className="rounded-2xl border border-border bg-surface-muted/40 px-6 py-5 shadow-[var(--shadow-card)]"
      >
        <h2 className="text-sm font-semibold text-foreground">
          Compra y vende con protección
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Tu actividad dentro de Melómanos ayuda a proteger conversaciones,
          favoritos y compras.
        </p>
      </aside>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted-foreground">
          Cargando…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
