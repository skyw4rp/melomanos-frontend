"use client";

import { FormEvent, useState } from "react";
import { sendMessage } from "@/lib/api";

interface MessageFormProps {
  listingId: number;
}

export default function MessageForm({ listingId }: MessageFormProps) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus("loading");
    setError("");

    try {
      await sendMessage({ listing_id: listingId, message_text: message.trim() });
      setMessage("");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to send message");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
    >
      <h2 className="text-lg font-semibold text-white">Contact seller</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Send a message about this listing.
      </p>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        required
        placeholder="Hi, is this still available?"
        className="mt-4 w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
      />

      {error && (
        <p className="mt-2 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {status === "success" && (
        <p className="mt-2 text-sm text-emerald-400">Message sent.</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-60"
      >
        {status === "loading" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
