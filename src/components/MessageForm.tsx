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
      setError(err instanceof Error ? err.message : "No se pudo enviar el mensaje");
    }
  }

  return (
    <form
      data-testid="message-form"
      onSubmit={handleSubmit}
      className={
        variant === "inline"
          ? "card-surface mt-4 p-5"
          : "card-surface mt-8 p-6"
      }
    >
      <h2 className="text-sm font-semibold text-foreground">Mensaje al vendedor</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Pregunta por condición, envío o disponibilidad del press.
      </p>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {MESSAGE_SAFETY_HELPER}
      </p>

      <textarea
        data-testid="message-form-textarea"
        value={message}
        onChange={(e) => handleMessageChange(e.target.value)}
        rows={4}
        required
        placeholder="¿Sigue disponible? ¿Haces envíos a regiones?"
        className="input-field resize-y"
      />

      {status === "blocked" && (
        <div
          data-testid="message-blocked-warning"
          className="mt-4 rounded-xl border border-amber-600/25 bg-amber-600/10 px-4 py-4"
          role="alert"
        >
          <p className="font-semibold text-amber-900">{ANTI_LEAK_BLOCKED_TITLE}</p>
          <p className="mt-2 text-sm leading-relaxed text-amber-900/90">
            {ANTI_LEAK_BLOCKED_BODY}
          </p>
        </div>
      )}

      {error && status === "error" && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {status === "success" && (
        <p
          data-testid="message-form-success"
          className="mt-2 text-sm text-success"
        >
          Mensaje enviado.
        </p>
      )}

      <button
        type="submit"
        data-testid="message-form-submit"
        disabled={status === "loading"}
        className="btn-primary mt-4 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}
