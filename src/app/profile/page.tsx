"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatProfileName, getUserInitials } from "@/lib/auth";
import {
  getConversations,
  getMe,
  getMyFavorites,
  getMyPurchases,
  getMySales,
  getStoredUser,
  getToken,
  logout,
  setStoredUser,
} from "@/lib/api";
import { formatPriceCLP, statusLabel } from "@/lib/format";
import type { Conversation, Listing, User } from "@/types";

type TabId = "sales" | "purchases" | "favorites" | "messages";

const tabs: { id: TabId; label: string }[] = [
  { id: "sales", label: "Mis ventas" },
  { id: "purchases", label: "Compras" },
  { id: "favorites", label: "Favoritos" },
  { id: "messages", label: "Mensajes" },
];

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center text-sm text-zinc-400">
      {message}
    </p>
  );
}

function ListingRow({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-violet-400/40 hover:bg-white/[0.06] sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="truncate font-semibold text-white">{listing.title}</p>
        <p className="truncate font-mono text-xs uppercase tracking-wide text-fuchsia-300/80">
          {listing.artist}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          {listing.genre} · {listing.city}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
        <span className="text-lg font-bold text-violet-100">
          {formatPriceCLP(listing.price_clp)}
        </span>
        <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-200">
          {statusLabel(listing.status)}
        </span>
      </div>
    </Link>
  );
}

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const title =
    conversation.listing_title ||
    (conversation.listing_id ? `Listing #${conversation.listing_id}` : "Conversación");
  const preview = conversation.last_message || "Sin mensajes aún";
  const unread = conversation.unread_count ?? 0;

  return (
    <Link
      href="/messages"
      className="block rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-violet-400/40 hover:bg-white/[0.06]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{title}</p>
          {conversation.other_user_name && (
            <p className="mt-0.5 text-xs text-violet-300/90">
              {conversation.other_user_name}
            </p>
          )}
          <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{preview}</p>
        </div>
        {unread > 0 && (
          <span className="shrink-0 rounded-full bg-fuchsia-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-fuchsia-100">
            {unread}
          </span>
        )}
      </div>
    </Link>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent
          ? "border-fuchsia-500/30 bg-gradient-to-br from-violet-950/60 to-fuchsia-950/30"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black tabular-nums text-white">{value}</p>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sales, setSales] = useState<Listing[]>([]);
  const [purchases, setPurchases] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("sales");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const stored = getStoredUser();
      if (stored) setUser(stored);

      const [me, salesData, purchasesData, favoritesData, convData] =
        await Promise.all([
          getMe(),
          getMySales(),
          getMyPurchases(),
          getMyFavorites(),
          getConversations(),
        ]);

      setStoredUser(me);
      setUser(me);
      setSales(salesData);
      setPurchases(purchasesData);
      setFavorites(favoritesData);
      setConversations(convData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cargar tu perfil.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    loadDashboard();
  }, [router, loadDashboard]);

  const stats = useMemo(() => {
    const activeListings = sales.filter(
      (l) => l.status.toLowerCase() === "available",
    ).length;
    const unreadMessages = conversations.reduce(
      (sum, c) => sum + (c.unread_count ?? 0),
      0,
    );
    return {
      activeListings,
      salesCount: sales.length,
      purchasesCount: purchases.length,
      favoritesCount: favorites.length,
      unreadMessages,
    };
  }, [sales, purchases, favorites, conversations]);

  if (loading && !user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-zinc-500">
        Cargando tu crate…
      </div>
    );
  }

  if (!user && error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm text-violet-300">
          Ir a login
        </Link>
      </div>
    );
  }

  if (!user) return null;

  const name = formatProfileName(user);
  const initials = getUserInitials(user);
  const city = user.city?.trim() || "—";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="font-mono text-xs uppercase tracking-wider text-violet-300 hover:text-violet-200"
      >
        ← Marketplace
      </Link>

      {error && (
        <p className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </p>
      )}

      <header className="mt-6 flex flex-col gap-6 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/50 via-[#120a1f] to-fuchsia-950/20 p-6 sm:flex-row sm:items-center sm:p-8">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-3xl font-bold text-white ring-2 ring-violet-400/40 shadow-lg shadow-violet-950/50">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/90">
            Collector
          </p>
          <h1 className="mt-1 text-3xl font-bold text-white">{name}</h1>
          <p className="mt-2 text-sm text-zinc-300">{user.email}</p>
          <p className="mt-1 text-sm text-zinc-500">
            <span className="text-zinc-600">Ciudad · </span>
            {city}
          </p>
        </div>
        <Link
          href="/sell"
          className="shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:from-violet-500 hover:to-fuchsia-500"
        >
          + Sell Vinyl
        </Link>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Activos" value={stats.activeListings} accent />
        <StatCard label="Ventas" value={stats.salesCount} />
        <StatCard label="Compras" value={stats.purchasesCount} />
        <StatCard label="Favoritos" value={stats.favoritesCount} />
        <StatCard
          label="Sin leer"
          value={stats.unreadMessages}
          accent={stats.unreadMessages > 0}
        />
      </div>

      <div className="mt-10 flex flex-wrap gap-2 border-b border-white/10 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.id
                ? "border border-b-0 border-white/10 bg-white/[0.06] text-white"
                : "text-zinc-400 hover:text-violet-200"
            }`}
          >
            {tab.label}
            {tab.id === "messages" && stats.unreadMessages > 0 && (
              <span className="ml-1.5 rounded-full bg-fuchsia-500/30 px-1.5 text-[10px] font-bold text-fuchsia-200">
                {stats.unreadMessages}
              </span>
            )}
          </button>
        ))}
      </div>

      <section className="mt-0 rounded-b-2xl rounded-tr-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
        {loading ? (
          <p className="py-12 text-center text-sm text-zinc-500">Cargando…</p>
        ) : (
          <>
            {activeTab === "sales" &&
              (sales.length === 0 ? (
                <EmptyState message="Aún no tienes ventas publicadas." />
              ) : (
                <ul className="space-y-3">
                  {sales.map((listing) => (
                    <li key={listing.id}>
                      <ListingRow listing={listing} />
                    </li>
                  ))}
                </ul>
              ))}

            {activeTab === "purchases" &&
              (purchases.length === 0 ? (
                <EmptyState message="Aún no tienes compras." />
              ) : (
                <ul className="space-y-3">
                  {purchases.map((listing) => (
                    <li key={listing.id}>
                      <ListingRow listing={listing} />
                    </li>
                  ))}
                </ul>
              ))}

            {activeTab === "favorites" &&
              (favorites.length === 0 ? (
                <EmptyState message="Aún no tienes favoritos." />
              ) : (
                <ul className="space-y-3">
                  {favorites.map((listing) => (
                    <li key={listing.id}>
                      <ListingRow listing={listing} />
                    </li>
                  ))}
                </ul>
              ))}

            {activeTab === "messages" &&
              (conversations.length === 0 ? (
                <EmptyState message="Aún no tienes mensajes." />
              ) : (
                <ul className="space-y-3">
                  {conversations.map((conversation) => (
                    <li key={conversation.id}>
                      <ConversationRow conversation={conversation} />
                    </li>
                  ))}
                </ul>
              ))}
          </>
        )}
      </section>

      <button
        type="button"
        onClick={() => {
          logout();
          router.push("/login");
        }}
        className="mt-8 w-full rounded-xl border border-white/15 py-3 text-sm font-medium text-zinc-300 transition hover:border-red-400/40 hover:text-red-200 sm:hidden"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
