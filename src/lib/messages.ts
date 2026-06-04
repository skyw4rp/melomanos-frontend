import type { Conversation, Message } from "@/types";

export const ANTI_LEAK_BLOCKED_TITLE = "Mensaje bloqueado por seguridad";

export const ANTI_LEAK_BLOCKED_BODY =
  "Por seguridad, mantén la compra y comunicación dentro de Melómanos. Las compras externas no generan tracking, reviews verificadas ni reputación.";

export const MESSAGE_SAFETY_HELPER =
  "Evita compartir WhatsApp, Instagram, teléfono o email. Las compras verificadas solo cuentan dentro de Melómanos.";

export function isAntiLeakBlockedError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message;
  return (
    msg.includes(ANTI_LEAK_BLOCKED_BODY) ||
    msg.includes("mantén la compra y comunicación dentro de Melómanos")
  );
}

export type MessageSenderLabel = "You" | "Buyer" | "Seller";

export const MESSAGES_UPDATED_EVENT = "melomanos:messages-updated";

export function dispatchMessagesUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MESSAGES_UPDATED_EVENT));
}

export function normalizeConversation(conv: Conversation): Conversation {
  return {
    ...conv,
    listing_id: conv.listing_id,
    other_user_id: conv.other_user_id,
    listing_seller_id: conv.listing_seller_id ?? conv.seller_id,
    last_message_text: conv.last_message_text ?? conv.last_message,
    last_message_at: conv.last_message_at ?? conv.updated_at,
  };
}

export function resolveListingSellerId(
  conversation: Conversation | undefined,
): number | null {
  const id = conversation?.listing_seller_id ?? conversation?.seller_id;
  return id ?? null;
}

export function resolveConversationPeerId(
  conversation: Conversation | undefined,
  messages: Message[],
  currentUserId: number,
): number | null {
  if (conversation?.other_user_id != null) {
    return conversation.other_user_id;
  }

  for (const message of messages) {
    if (message.sender_id !== currentUserId) return message.sender_id;
    if (message.receiver_id !== currentUserId) return message.receiver_id;
  }

  return null;
}

export function getMessageSenderLabel(
  message: Message,
  currentUserId: number,
  listingSellerId: number | null,
): MessageSenderLabel {
  if (message.sender_id === currentUserId) return "You";
  if (listingSellerId != null && message.sender_id === listingSellerId) {
    return "Seller";
  }
  return "Buyer";
}

export function filterVisibleMessages(messages: Message[]): Message[] {
  return messages.filter((m) => !m.is_deleted);
}

export function totalUnreadCount(conversations: Conversation[]): number {
  return conversations.reduce((sum, c) => sum + (c.unread_count ?? 0), 0);
}

export function sortMessagesChronologically(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => {
    const ta = new Date(a.created_at ?? 0).getTime();
    const tb = new Date(b.created_at ?? 0).getTime();
    return ta - tb;
  });
}

export function isMessageUnreadForUser(message: Message, userId: number): boolean {
  if (message.receiver_id !== userId) return false;
  if (message.is_read === true || message.read === true) return false;
  if (message.is_read === false || message.read === false) return true;
  return true;
}
