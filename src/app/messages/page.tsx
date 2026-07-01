"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import MessageBubble from "@/components/MessageBubble";
import {
  deleteMessage,
  getConversations,
  getMe,
  getMessagesForListing,
  getToken,
  setStoredUser,
  markMessageRead,
  markMessageUnread,
  replyToMessage,
} from "@/lib/api";
import { formatMessageTime } from "@/lib/format";
import { handleAuthRedirect, redirectToLogin } from "@/lib/auth-session";
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

const inputClass =
  "w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60";

function conversationTitle(conv: Conversation): string {
  return (
    conv.listing_title ||
    (conv.listing_id ? `Publicación #${conv.listing_id}` : "Conversación")
  );
}

function conversationPreview(conv: Conversation): string {
  return conv.last_message_text?.trim() || "Sin mensajes aún";
}

function ConversationsEmptyState() {
  return (
    <div
      data-testid="messages-inbox-empty"
      className="mx-4 my-6 rounded-2xl border border-dashed border-border bg-surface-muted/30 px-6 py-10 text-center"
    >
      <p className="text-base font-semibold text-foreground">Aún no tienes mensajes</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Cuando converses con un comprador o vendedor, tus mensajes aparecerán aquí.
      </p>
      <Link href="/" className="btn-primary mt-6 inline-flex px-5 py-2.5 text-sm">
        Explorar catálogo
      </Link>
    </div>
  );
}

export default function MessagesPage() {
  const router = useRouter();
  const pathname = usePathname();
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
        if (handleAuthRedirect(err, router, pathname)) return;
        setMessages([]);
        setThreadError(
          err instanceof Error ? err.message : "No se pudo cargar la conversación.",
        );
      } finally {
        setLoadingThread(false);
      }
    },
    [markUnreadInThread, router, pathname],
  );

  useEffect(() => {
    if (!getToken()) {
      redirectToLogin(router, pathname);
      return;
    }

    async function init() {
      try {
        const me = await getMe();
        setStoredUser(me);
        setUser(me);
      } catch (err) {
        if (handleAuthRedirect(err, router, pathname)) return;
        redirectToLogin(router, pathname);
        return;
      }

      setLoadingInbox(true);
      setError("");
      loadConversations()
        .catch((err) => {
          if (handleAuthRedirect(err, router, pathname)) return;
          setError(
            err instanceof Error ? err.message : "No se pudieron cargar las conversaciones.",
          );
        })
        .finally(() => setLoadingInbox(false));
    }

    init();
  }, [router, pathname, loadConversations]);

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
      if (handleAuthRedirect(err, router, pathname)) return;
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
      if (handleAuthRedirect(err, router, pathname)) return;
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
      if (handleAuthRedirect(err, router, pathname)) return;
      setThreadError(
        err instanceof Error ? err.message : "No se pudo marcar como no leído.",
      );
    } finally {
      setActionMessageId(null);
    }
  }

  const showThreadOnMobile = selectedListingId !== null;

  return (
    <div
      data-testid="messages-page"
      className="mx-auto flex max-w-6xl flex-col px-4 py-8 sm:px-6 sm:py-10"
    >
      <Link
        href="/"
        data-testid="messages-back-link"
        className="text-sm font-medium text-muted-foreground transition hover:text-accent"
      >
        ← Volver al catálogo
      </Link>

      <header className="mt-4 shrink-0">
        <p className="editorial-label text-accent">Conversaciones Melómanos</p>
        <h1
          data-testid="messages-page-title"
          className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          Mensajes
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Conversa con compradores y vendedores sobre tus publicaciones.
        </p>
      </header>

      <aside
        data-testid="messages-trust-block"
        className="mt-6 shrink-0 rounded-2xl border border-border bg-surface-muted/40 px-5 py-4 shadow-[var(--shadow-card)] sm:px-6 sm:py-5"
      >
        <h2 className="text-sm font-semibold text-foreground">Compra y vende seguro</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Mantén la conversación dentro de Melómanos para proteger acuerdos, pagos y
          seguimiento de tus compras.
        </p>
      </aside>

      {error && (
        <p
          className="mt-6 shrink-0 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="mt-6 flex min-h-[70vh] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] lg:min-h-[calc(100vh-18rem)] lg:flex-row">
        {/* Conversation list */}
        <aside
          data-testid="messages-list"
          className={`flex w-full shrink-0 flex-col border-border lg:w-80 lg:border-r ${
            showThreadOnMobile ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Conversaciones
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingInbox && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Cargando…
              </p>
            )}

            {!loadingInbox && conversations.length === 0 && <ConversationsEmptyState />}

            {!loadingInbox &&
              conversations.map((conv) => {
                const active = conv.listing_id === selectedListingId;
                const unread = conv.unread_count ?? 0;

                return (
                  <button
                    key={conv.id}
                    type="button"
                    data-testid={`messages-conversation-${conv.listing_id}`}
                    onClick={() => user && openConversation(conv.listing_id, user)}
                    className={`w-full border-b border-border px-4 py-3 text-left transition ${
                      active
                        ? "bg-surface-muted/60 ring-1 ring-inset ring-accent/30"
                        : "hover:bg-surface-muted/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 font-semibold text-foreground">
                        {conversationTitle(conv)}
                      </p>
                      {unread > 0 && (
                        <span className="shrink-0 rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-accent ring-1 ring-accent/30">
                          {unread}
                        </span>
                      )}
                    </div>
                    {conv.other_user_name && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {conv.other_user_name}
                      </p>
                    )}
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {conversationPreview(conv)}
                    </p>
                    {conv.last_message_at && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {formatMessageTime(conv.last_message_at)}
                      </p>
                    )}
                  </button>
                );
              })}
          </div>
        </aside>

        {/* Thread */}
        <section
          data-testid="message-thread"
          className={`flex min-w-0 flex-1 flex-col bg-surface ${
            showThreadOnMobile ? "flex" : "hidden lg:flex"
          }`}
        >
          {!selectedListingId && (
            <div
              data-testid="message-empty-state"
              className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center"
            >
              <p className="text-base font-semibold text-foreground">
                Selecciona una conversación
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Elige una conversación para revisar mensajes sobre una publicación.
              </p>
            </div>
          )}

          {selectedListingId && selectedConversation && user && (
            <>
              <header className="flex items-center gap-3 border-b border-border px-4 py-3">
                <button
                  type="button"
                  onClick={() => setSelectedListingId(null)}
                  className="btn-ghost px-2 py-1 text-xs lg:hidden"
                >
                  ← Conversaciones
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">
                    {conversationTitle(selectedConversation)}
                  </p>
                  {selectedConversation.other_user_name && (
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedConversation.other_user_name}
                    </p>
                  )}
                </div>
                <Link
                  href={`/listings/${selectedListingId}`}
                  className="shrink-0 text-xs font-medium text-accent hover:underline"
                >
                  Ver publicación
                </Link>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto bg-background/40 px-4 py-4">
                {loadingThread && (
                  <p className="text-center text-sm text-muted-foreground">
                    Cargando mensajes…
                  </p>
                )}

                {threadError && (
                  <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {threadError}
                  </p>
                )}

                {!loadingThread && messages.length === 0 && !threadError && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm font-medium text-foreground">
                      Aún no hay mensajes
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Envía el primer mensaje sobre esta publicación.
                    </p>
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
                className="shrink-0 border-t border-border bg-surface p-4"
              >
                <label htmlFor="reply" className="sr-only">
                  Mensaje
                </label>
                <textarea
                  id="reply"
                  data-testid="messages-reply-input"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={2}
                  placeholder="Escribe un mensaje…"
                  disabled={sending}
                  className={inputClass}
                />
                <button
                  type="submit"
                  data-testid="messages-send-btn"
                  disabled={sending || !reply.trim()}
                  className="btn-primary mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
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
