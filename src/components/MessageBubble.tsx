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
            className={`text-[10px] font-medium uppercase tracking-[0.06em] ${
              isMine ? "text-accent" : "text-muted-foreground"
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
                className="rounded-md px-1.5 py-0.5 text-xs text-muted-foreground opacity-70 transition hover:bg-surface-muted hover:text-foreground group-hover:opacity-100 disabled:opacity-40"
                aria-label="Acciones del mensaje"
                aria-expanded={menuOpen}
              >
                ···
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-10 mt-1 min-w-[9.5rem] overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-[var(--shadow-card-hover)]"
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
                      className="block w-full px-3 py-2 text-left text-sm text-foreground transition hover:bg-surface-muted disabled:opacity-50"
                    >
                      Marcar como no leído
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
                      className="block w-full px-3 py-2 text-left text-sm text-destructive transition hover:bg-destructive/5 disabled:opacity-50"
                    >
                      Eliminar
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
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md border border-border bg-surface text-foreground shadow-sm"
          }`}
        >
          <p className="whitespace-pre-wrap text-sm">{message.message_text}</p>
          {message.created_at && (
            <p
              className={`mt-1 text-[10px] ${
                isMine ? "text-primary-foreground/70" : "text-muted-foreground"
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
