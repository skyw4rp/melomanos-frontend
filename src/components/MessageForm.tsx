"use client";

import { FormEvent, useState } from "react";
import { sendMessage } from "@/lib/api";
import {
  ANTI_LEAK_BLOCKED_BODY,
  ANTI_LEAK_BLOCKED_TITLE,
  dispatchMessagesUpdated,
  isAntiLeakBlockedError,
  MESSAGE_SAFETY_HELPER,
} from "@/lib/messages";
import { dispatchNotificationsUpdated } from "@/lib/notifications";

interface MessageFormProps {
  listingId: number;
  variant?: "default" | "inline";
}

export default function MessageForm({
  listingId,
  variant = "default",
}: MessageFormProps) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error" | "blocked"
  >("idle");
  const [error, setError] = useState("");

  function handleMessageChange(value: string) {
    setMessage(value);
    if (status === "blocked") {
      setStatus("idle");
    }
    if (error) setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus("loading");
    setError("");

    try {
      await sendMessage({ listing_id: listingId, message_text: message.trim() });
      setMessage("");
      setStatus("success");
      dispatchMessagesUpdated();
      dispatchNotificationsUpdated();
    } catch (err) {
      if (isAntiLeakBlockedError(err)) {
        setStatus("blocked");
        return;
      }
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to send message");
    }
  }

  return (
    <form
      data-testid="message-form"
      onSubmit={handleSubmit}
      className={
        variant === "inline"
          ? "rounded-2xl border border-white/10 bg-black/30 p-5"
          : "mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
      }
    >
      <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-violet-200">
        Mensaje al vendedor
      </h2>
      <p className="mt-1 text-sm text-zinc-400">
        Pregunta por condición, envío o disponibilidad del press.
      </p>

      <p className="mt-3 text-xs leading-relaxed text-zinc-500">
        {MESSAGE_SAFETY_HELPER}
      </p>

      <textarea
        data-testid="message-form-textarea"
        value={message}
        onChange={(e) => handleMessageChange(e.target.value)}
        rows={4}
        required
        placeholder="¿Sigue disponible? ¿Haces envíos a regiones?"
        className="mt-4 w-full resize-y rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
      />

      {status === "blocked" && (
        <div
          data-testid="message-blocked-warning"
          className="mt-4 rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-violet-950/30 to-[#0d0a14] px-4 py-4"
          role="alert"
        >
          <p className="font-semibold text-amber-200">{ANTI_LEAK_BLOCKED_TITLE}</p>
          <p className="mt-2 text-sm leading-relaxed text-amber-100/90">
            {ANTI_LEAK_BLOCKED_BODY}
          </p>
        </div>
      )}

      {error && status === "error" && (
        <p className="mt-2 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {status === "success" && (
        <p
          data-testid="message-form-success"
          className="mt-2 text-sm text-emerald-400"
        >
          Mensaje enviado.
        </p>
      )}

      <button
        type="submit"
        data-testid="message-form-submit"
        disabled={status === "loading"}
        className="mt-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-60"
      >
        {status === "loading" ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}
