"use client";

import { useEffect, useRef, useState } from "react";
import { formatMessageTime } from "@/lib/format";
import type { MessageSenderLabel } from "@/lib/messages";
import type { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  senderLabel: MessageSenderLabel;
  canDelete: boolean;
  canMarkUnread: boolean;
  onDelete: () => void;
  onMarkUnread: () => void;
  busy?: boolean;
}

export default function MessageBubble({
  message,
  isMine,
  senderLabel,
  canDelete,
  canMarkUnread,
  onDelete,
  onMarkUnread,
  busy = false,
}: MessageBubbleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const hasActions = canDelete || canMarkUnread;

  return (
    <div className={`group flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative flex max-w-[85%] flex-col sm:max-w-[70%] ${
          isMine ? "items-end" : "items-start"
        }`}
      >
        <div className="mb-1 flex items-center gap-2 px-1">
          <span
            className={`font-mono text-[10px] uppercase tracking-wider ${
              isMine ? "text-fuchsia-300/90" : "text-violet-300/80"
            }`}
          >
            {senderLabel}
          </span>
          {hasActions && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                disabled={busy}
                className="rounded-md px-1.5 py-0.5 text-xs text-zinc-500 opacity-70 transition hover:bg-white/10 hover:text-zinc-300 group-hover:opacity-100 disabled:opacity-40"
                aria-label="Message actions"
                aria-expanded={menuOpen}
              >
                ···
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-10 mt-1 min-w-[9.5rem] overflow-hidden rounded-xl border border-white/10 bg-[#120e1a] py-1 shadow-xl shadow-violet-950/50"
                >
                  {canMarkUnread && (
                    <button
                      type="button"
                      role="menuitem"
                      disabled={busy}
                      onClick={() => {
                        setMenuOpen(false);
                        onMarkUnread();
                      }}
                      className="block w-full px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-violet-950/60 disabled:opacity-50"
                    >
                      Mark unread
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      role="menuitem"
                      disabled={busy}
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete();
                      }}
                      className="block w-full px-3 py-2 text-left text-sm text-red-300 transition hover:bg-red-950/40 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isMine
              ? "rounded-br-md bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
              : "rounded-bl-md border border-white/10 bg-white/[0.06] text-zinc-100"
          }`}
        >
          <p className="whitespace-pre-wrap text-sm">{message.message_text}</p>
          {message.created_at && (
            <p
              className={`mt-1 font-mono text-[10px] ${
                isMine ? "text-violet-200/70" : "text-zinc-500"
              }`}
            >
              {formatMessageTime(message.created_at)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
