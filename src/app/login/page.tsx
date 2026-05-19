"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { dispatchAuthChange } from "@/lib/auth-events";
import { getMe, login, setStoredUser, setToken } from "@/lib/api";

function formatLoginError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message.trim();
    if (msg.includes("401") || msg.toLowerCase().includes("incorrect")) {
      return "Email o contraseña incorrectos. Intenta de nuevo.";
    }
    if (msg.length > 0 && msg.length < 200) return msg;
  }
  return "No se pudo iniciar sesión. Verifica tus datos e intenta otra vez.";
}

export default function LoginPage() {
  const router = useRouter();
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
        router.push("/");
        router.refresh();
      }, 900);
    } catch (err) {
      setError(formatLoginError(err));
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-xl shadow-violet-950/20">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/90">
          Acceso coleccionistas
        </p>
        <h1 className="mt-2 text-2xl font-bold text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Sign in to save favorites, message sellers, and list vinyl.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              disabled={loading || success}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-300"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={loading || success}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-60"
            />
          </div>

          {error && (
            <div
              className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              role="alert"
            >
              {error}
            </div>
          )}

          {success && (
            <p
              className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
              role="status"
            >
              Login successful, redirecting…
            </p>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-60"
          >
            {loading ? "Signing in…" : success ? "Redirecting…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/" className="text-violet-300 hover:text-violet-200">
            Back to marketplace
          </Link>
        </p>
      </div>
    </div>
  );
}
