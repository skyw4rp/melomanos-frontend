"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MessageBubble from "@/components/MessageBubble";
import {
  deleteMessage,
  getConversations,
  getMe,
  getMessagesForListing,
  getStoredUser,
  getToken,
  setStoredUser,
  markMessageRead,
  markMessageUnread,
  replyToMessage,
} from "@/lib/api";
import { formatMessageTime } from "@/lib/format";
import {
  dispatchMessagesUpdated,
  filterVisibleMessages,
  getMessageSenderLabel,
  isMessageUnreadForUser,
  normalizeConversation,
  resolveConversationPeerId,
  resolveListingSellerId,
  sortMessagesChronologically,
} from "@/lib/messages";
import type { Conversation, Message, User } from "@/types";

function conversationTitle(conv: Conversation): string {
  return (
    conv.listing_title ||
    (conv.listing_id ? `Listing #${conv.listing_id}` : "Conversación")
  );
}

function conversationPreview(conv: Conversation): string {
  return conv.last_message_text?.trim() || "Sin mensajes aún";
}

export default function MessagesPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [actionMessageId, setActionMessageId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [threadError, setThreadError] = useState("");

  const selectedConversation = conversations.find(
    (c) => c.listing_id === selectedListingId,
  );

  const listingSellerId = resolveListingSellerId(selectedConversation);

  const loadConversations = useCallback(async () => {
    const items = await getConversations();
    const normalized = (Array.isArray(items) ? items : []).map(normalizeConversation);
    setConversations(normalized);
    return normalized;
  }, []);

  const markUnreadInThread = useCallback(
    async (thread: Message[], currentUserId: number) => {
      const unread = thread.filter((m) => isMessageUnreadForUser(m, currentUserId));
      if (unread.length === 0) return;

      await Promise.all(unread.map((m) => markMessageRead(m.id).catch(() => undefined)));

      setMessages((prev) =>
        prev.map((m) =>
          isMessageUnreadForUser(m, currentUserId)
            ? { ...m, is_read: true, read: true }
            : m,
        ),
      );

      setConversations((prev) =>
        prev.map((c) =>
          c.listing_id === selectedListingId ? { ...c, unread_count: 0 } : c,
        ),
      );
      dispatchMessagesUpdated();
    },
    [selectedListingId],
  );

  const openConversation = useCallback(
    async (listingId: number, currentUser: User) => {
      setSelectedListingId(listingId);
      setThreadError("");
      setLoadingThread(true);

      try {
        const raw = await getMessagesForListing(listingId);
        const sorted = sortMessagesChronologically(filterVisibleMessages(raw));
        setMessages(sorted);
        await markUnreadInThread(sorted, currentUser.id);
      } catch (err) {
        setMessages([]);
        setThreadError(
          err instanceof Error ? err.message : "No se pudo cargar la conversación.",
        );
      } finally {
        setLoadingThread(false);
      }
    },
    [markUnreadInThread],
  );

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    async function init() {
      try {
        const stored = getStoredUser();
        const me = stored ?? (await getMe());
        setStoredUser(me);
        setUser(me);
      } catch {
        router.replace("/login");
        return;
      }

      setLoadingInbox(true);
      setError("");
      loadConversations()
        .catch((err) => {
          setError(err instanceof Error ? err.message : "No se pudo cargar el inbox.");
        })
        .finally(() => setLoadingInbox(false));
    }

    init();
  }, [router, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedListingId]);

  async function refreshThread(listingId: number) {
    const raw = await getMessagesForListing(listingId);
    const sorted = sortMessagesChronologically(filterVisibleMessages(raw));
    setMessages(sorted);
    return sorted;
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!selectedListingId || !reply.trim() || !user) return;

    const receiverId = resolveConversationPeerId(
      selectedConversation,
      messages,
      user.id,
    );
    if (!receiverId) {
      setThreadError("No se pudo determinar el destinatario de esta conversación.");
      return;
    }

    setSending(true);
    setThreadError("");

    try {
      await replyToMessage({
        listing_id: selectedListingId,
        receiver_id: receiverId,
        message_text: reply.trim(),
      });
      setReply("");

      await refreshThread(selectedListingId);
      await loadConversations();
      dispatchMessagesUpdated();
    } catch (err) {
      setThreadError(err instanceof Error ? err.message : "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteMessage(messageId: number) {
    if (!selectedListingId) return;

    setActionMessageId(messageId);
    setThreadError("");

    try {
      await deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      await loadConversations();
      dispatchMessagesUpdated();
    } catch (err) {
      setThreadError(err instanceof Error ? err.message : "No se pudo eliminar el mensaje.");
    } finally {
      setActionMessageId(null);
    }
  }

  async function handleMarkUnread(message: Message) {
    if (!user || !selectedListingId) return;

    setActionMessageId(message.id);
    setThreadError("");

    try {
      await markMessageUnread(message.id);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id ? { ...m, is_read: false, read: false } : m,
        ),
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.listing_id === selectedListingId
            ? { ...c, unread_count: (c.unread_count ?? 0) + 1 }
            : c,
        ),
      );
      dispatchMessagesUpdated();
    } catch (err) {
      setThreadError(
        err instanceof Error ? err.message : "No se pudo marcar como no leído.",
      );
    } finally {
      setActionMessageId(null);
    }
  }

  const showThreadOnMobile = selectedListingId !== null;

  return (
    <div className="mx-auto flex h-[calc(100vh-4.5rem)] max-w-6xl flex-col px-4 py-6 sm:px-6 lg:h-[calc(100vh-5rem)]">
      <div className="mb-4 shrink-0">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-wider text-violet-300 hover:text-violet-200"
        >
          ← Marketplace
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Messages</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Conversaciones sobre listings en el crate.
        </p>
      </div>

      {error && (
        <p className="mb-4 shrink-0 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0810] shadow-xl shadow-violet-950/30">
        {/* Inbox column */}
        <aside
          className={`flex w-full shrink-0 flex-col border-white/10 lg:w-80 lg:border-r ${
            showThreadOnMobile ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="border-b border-white/10 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/90">
              Inbox
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingInbox && (
              <p className="px-4 py-8 text-center text-sm text-zinc-500">Cargando…</p>
            )}

            {!loadingInbox && conversations.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-zinc-400">
                Aún no tienes mensajes.
              </p>
            )}

            {!loadingInbox &&
              conversations.map((conv) => {
                const active = conv.listing_id === selectedListingId;
                const unread = conv.unread_count ?? 0;

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => user && openConversation(conv.listing_id, user)}
                    className={`w-full border-b border-white/5 px-4 py-3 text-left transition ${
                      active
                        ? "bg-violet-950/50"
                        : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 font-semibold text-white">
                        {conversationTitle(conv)}
                      </p>
                      {unread > 0 && (
                        <span className="shrink-0 rounded-full bg-fuchsia-500/30 px-1.5 py-0.5 font-mono text-[10px] font-bold text-fuchsia-100">
                          {unread}
                        </span>
                      )}
                    </div>
                    {conv.other_user_name && (
                      <p className="mt-0.5 text-xs text-violet-300/80">
                        {conv.other_user_name}
                      </p>
                    )}
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
                      {conversationPreview(conv)}
                    </p>
                    {conv.last_message_at && (
                      <p className="mt-1 font-mono text-[10px] text-zinc-600">
                        {formatMessageTime(conv.last_message_at)}
                      </p>
                    )}
                  </button>
                );
              })}
          </div>
        </aside>

        {/* Thread column */}
        <section
          className={`flex min-w-0 flex-1 flex-col ${
            showThreadOnMobile ? "flex" : "hidden lg:flex"
          }`}
        >
          {!selectedListingId && (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-zinc-500">
              <p className="text-sm">Selecciona una conversación</p>
            </div>
          )}

          {selectedListingId && selectedConversation && user && (
            <>
              <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setSelectedListingId(null)}
                  className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300 lg:hidden"
                >
                  ← Inbox
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">
                    {conversationTitle(selectedConversation)}
                  </p>
                  {selectedConversation.other_user_name && (
                    <p className="truncate text-xs text-violet-300/80">
                      {selectedConversation.other_user_name}
                    </p>
                  )}
                </div>
                <Link
                  href={`/listings/${selectedListingId}`}
                  className="shrink-0 text-xs font-medium text-violet-300 hover:text-violet-200"
                >
                  Ver listing
                </Link>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {loadingThread && (
                  <p className="text-center text-sm text-zinc-500">Cargando mensajes…</p>
                )}

                {threadError && (
                  <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {threadError}
                  </p>
                )}

                {!loadingThread && messages.length === 0 && !threadError && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/80">
                      Thread
                    </p>
                    <p className="mt-2 text-sm text-zinc-400">No messages yet</p>
                  </div>
                )}

                {!loadingThread &&
                  messages.map((msg) => {
                    const isMine = msg.sender_id === user.id;
                    const senderLabel = getMessageSenderLabel(
                      msg,
                      user.id,
                      listingSellerId,
                    );
                    const isRead =
                      msg.is_read === true || msg.read === true;
                    const canMarkUnread =
                      msg.receiver_id === user.id && isRead;
                    const canDelete = isMine;
                    const busy = actionMessageId === msg.id;

                    return (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isMine={isMine}
                        senderLabel={senderLabel}
                        canDelete={canDelete}
                        canMarkUnread={canMarkUnread}
                        busy={busy}
                        onDelete={() => handleDeleteMessage(msg.id)}
                        onMarkUnread={() => handleMarkUnread(msg)}
                      />
                    );
                  })}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSend}
                className="shrink-0 border-t border-white/10 bg-black/20 p-4"
              >
                <label htmlFor="reply" className="sr-only">
                  Reply
                </label>
                <textarea
                  id="reply"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={2}
                  placeholder="Escribe un mensaje…"
                  disabled={sending}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="mt-2 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 sm:w-auto sm:px-8"
                >
                  {sending ? "Enviando…" : "Enviar"}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
