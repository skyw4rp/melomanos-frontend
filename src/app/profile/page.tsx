"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { formatProfileName, getUserInitials } from "@/lib/auth";
import { handleAuthRedirect, redirectToLogin } from "@/lib/auth-session";
import {
  getConversations,
  getDiggingScore,
  getMe,
  getMyFavorites,
  getMyPurchases,
  getMySales,
  getMySubscription,
  getSellerReputation,
  getToken,
  logout,
  setStoredUser,
} from "@/lib/api";
import DiggingScorePanel from "@/components/DiggingScorePanel";
import SellerShippingProfileSection from "@/components/SellerShippingProfileSection";
import SubscriptionCard from "@/components/SubscriptionCard";
import TrustBadgesPanel from "@/components/TrustBadgesPanel";
import { formatAverageRating, trustLevelLabel } from "@/lib/reputation";
import { formatPriceCLP, normalizeListingStatus, statusLabel } from "@/lib/format";
import { listingsFromFavorites } from "@/lib/listing-normalize";
import type {
  Conversation,
  DiggingScore,
  Listing,
  SellerReputation,
  SubscriptionStatus,
  User,
} from "@/types";

type TabId = "sales" | "purchases" | "favorites" | "messages";

const tabs: { id: TabId; label: string }[] = [
  { id: "sales", label: "Mis ventas" },
  { id: "purchases", label: "Compras" },
  { id: "favorites", label: "Favoritos" },
  { id: "messages", label: "Mensajes" },
];

const cardClass =
  "rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]";

const statCellClass =
  "rounded-xl border border-border bg-surface p-4 shadow-sm";

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-surface-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}

function ListingRow({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 transition hover:border-accent/40 hover:shadow-[var(--shadow-card-hover)] sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="truncate font-semibold text-foreground">{listing.title}</p>
        <p className="truncate text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
          {listing.artist}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {listing.genre} · {listing.city}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
        <span className="text-lg font-bold text-foreground">
          {formatPriceCLP(listing.price_clp)}
        </span>
        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground ring-1 ring-border">
          {statusLabel(listing.status)}
        </span>
      </div>
    </Link>
  );
}

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const title =
    conversation.listing_title ||
    (conversation.listing_id ? `Publicación #${conversation.listing_id}` : "Conversación");
  const preview =
    conversation.last_message_text?.trim() ||
    conversation.last_message ||
    "Sin mensajes aún";
  const unread = conversation.unread_count ?? 0;

  return (
    <Link
      href="/messages"
      className="block rounded-xl border border-border bg-surface p-4 transition hover:border-accent/40 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{title}</p>
          {conversation.other_user_name && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {conversation.other_user_name}
            </p>
          )}
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{preview}</p>
        </div>
        {unread > 0 && (
          <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold tabular-nums text-accent ring-1 ring-accent/30">
            {unread}
          </span>
        )}
      </div>
    </Link>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className={statCellClass}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sales, setSales] = useState<Listing[]>([]);
  const [purchases, setPurchases] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [reputation, setReputation] = useState<SellerReputation | null>(null);
  const [diggingScore, setDiggingScore] = useState<DiggingScore | null>(null);
  const [diggingScoreUnavailable, setDiggingScoreUnavailable] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("sales");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [me, salesData, purchasesData, favoritesData, convData] =
        await Promise.all([
          getMe(),
          getMySales(),
          getMyPurchases(),
          getMyFavorites(),
          getConversations(),
        ]);

      let reputationData: SellerReputation | null = null;
      let diggingScoreData: DiggingScore | null = null;
      let diggingUnavailable = false;
      let subscriptionData: SubscriptionStatus | null = null;
      try {
        reputationData = await getSellerReputation(me.id);
      } catch {
        reputationData = null;
      }
      try {
        diggingScoreData = await getDiggingScore(me.id);
      } catch {
        diggingScoreData = null;
        diggingUnavailable = true;
      }
      try {
        subscriptionData = await getMySubscription();
      } catch {
        subscriptionData = null;
      }

      setStoredUser(me);
      setUser(me);
      setSales(salesData);
      setPurchases(purchasesData);
      setFavorites(listingsFromFavorites(favoritesData));
      setConversations(convData);
      setReputation(reputationData);
      setDiggingScore(diggingScoreData);
      setDiggingScoreUnavailable(diggingUnavailable);
      setSubscription(subscriptionData);
    } catch (err) {
      if (handleAuthRedirect(err, router, pathname)) return;
      setError(
        err instanceof Error ? err.message : "No se pudo cargar tu perfil.",
      );
    } finally {
      setLoading(false);
    }
  }, [router, pathname]);

  useEffect(() => {
    if (!getToken()) {
      redirectToLogin(router, pathname);
      return;
    }
    loadDashboard();
  }, [router, pathname, loadDashboard]);

  const safeSales = Array.isArray(sales) ? sales : [];
  const safePurchases = Array.isArray(purchases) ? purchases : [];
  const safeFavorites = Array.isArray(favorites) ? favorites : [];
  const safeConversations = Array.isArray(conversations) ? conversations : [];

  const stats = useMemo(() => {
    const activeListings = safeSales.filter(
      (l) => normalizeListingStatus(l.status) === "available",
    ).length;
    const unreadMessages = safeConversations.reduce(
      (sum, c) => sum + (c.unread_count ?? 0),
      0,
    );
    return {
      activeListings,
      salesCount: safeSales.length,
      purchasesCount: safePurchases.length,
      favoritesCount: safeFavorites.length,
      unreadMessages,
    };
  }, [safeSales, safePurchases, safeFavorites, safeConversations]);

  if (loading && !user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-muted-foreground">
        Cargando tu perfil…
      </div>
    );
  }

  if (!user && error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  if (!user) return null;

  const name = formatProfileName(user);
  const initials = getUserInitials(user);
  const city = user.city?.trim() || "—";
  const roleSubtitle =
    city !== "—" ? `Coleccionista · ${city}` : "Coleccionista";

  return (
    <div
      data-testid="profile-page"
      className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10"
    >
      <Link
        href="/"
        data-testid="profile-back-link"
        className="text-sm font-medium text-muted-foreground transition hover:text-accent"
      >
        ← Volver al catálogo
      </Link>

      {error && (
        <p className="mt-4 rounded-xl border border-amber-600/25 bg-amber-600/10 px-4 py-3 text-sm text-amber-900">
          {error}
        </p>
      )}

      <header
        data-testid="profile-header"
        className={`mt-6 flex flex-col gap-6 ${cardClass} p-6 sm:flex-row sm:items-center sm:p-8`}
      >
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted text-3xl font-bold text-foreground ring-2 ring-accent/30">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="editorial-label text-accent">Coleccionista</p>
          <h1
            data-testid="profile-name"
            className="mt-1 text-3xl font-bold tracking-tight text-foreground"
          >
            {name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-sm text-foreground">{roleSubtitle}</p>
        </div>
        <Link
          href="/sell"
          data-testid="profile-sell-cta"
          className="btn-primary shrink-0 px-5 py-3 text-center text-sm"
        >
          Publicar vinilo
        </Link>
      </header>

      <div
        data-testid="profile-stats"
        className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        <StatCard label="Publicaciones activas" value={stats.activeListings} />
        <StatCard label="Ventas" value={stats.salesCount} />
        <StatCard label="Compras" value={stats.purchasesCount} />
        <StatCard label="Favoritos" value={stats.favoritesCount} />
        <StatCard label="Mensajes sin leer" value={stats.unreadMessages} />
      </div>

      {subscription && (
        <div data-testid="profile-plan-card">
          <SubscriptionCard subscription={subscription} variant="profile" />
        </div>
      )}

      {reputation ? (
        <section
          data-testid="profile-reputation-section"
          className={`mt-8 ${cardClass} p-6 sm:p-8`}
        >
          <h2 className="text-sm font-semibold text-foreground">Reputación Melómanos</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Tu reputación crece según tus compras, ventas y comportamiento dentro de
            la comunidad.
          </p>
          <p className="mt-4 inline-block rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent ring-1 ring-accent/30">
            {trustLevelLabel(reputation.trust_level)}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className={statCellClass}>
              <p className="text-xs font-medium text-muted-foreground">Calificación</p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {formatAverageRating(reputation.average_rating)}
              </p>
            </div>
            <div className={statCellClass}>
              <p className="text-xs font-medium text-muted-foreground">
                Ventas completadas
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                {reputation.completed_sales}
              </p>
            </div>
            <div className={statCellClass}>
              <p className="text-xs font-medium text-muted-foreground">
                Intercambios protegidos
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                {reputation.protected_trades}
              </p>
            </div>
            <div className={statCellClass}>
              <p className="text-xs font-medium text-muted-foreground">Reseñas</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                {reputation.total_reviews}
              </p>
            </div>
          </div>
          {reputation.disputed_orders > 0 && (
            <p className="mt-4 text-sm text-destructive">
              Disputas registradas: {reputation.disputed_orders}
            </p>
          )}
          <TrustBadgesPanel badges={reputation.badges} editorial />
        </section>
      ) : (
        !loading && (
          <section
            data-testid="profile-reputation-section"
            className={`mt-8 ${cardClass} p-6 sm:p-8`}
          >
            <h2 className="text-sm font-semibold text-foreground">Reputación Melómanos</h2>
            <p className="mt-3 text-sm font-medium text-foreground">
              Aún no tienes reseñas
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Cuando completes ventas o compras, tu reputación aparecerá aquí.
            </p>
          </section>
        )
      )}

      <DiggingScorePanel
        diggingScore={diggingScore}
        showFallback={diggingScoreUnavailable}
        editorial
      />

      <SellerShippingProfileSection />

      <div className="mt-10 flex flex-wrap gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.id === "messages" && stats.unreadMessages > 0 && (
              <span className="ml-1.5 rounded-full bg-accent/15 px-1.5 text-[10px] font-bold text-accent ring-1 ring-accent/30">
                {stats.unreadMessages}
              </span>
            )}
          </button>
        ))}
      </div>

      <section className={`mt-0 ${cardClass} rounded-t-none border-t-0 p-4 sm:p-6`}>
        {loading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Cargando…</p>
        ) : (
          <>
            {activeTab === "sales" &&
              (safeSales.length === 0 ? (
                <EmptyState message="Aún no tienes ventas publicadas." />
              ) : (
                <ul className="space-y-3">
                  {safeSales.map((listing) => (
                    <li key={listing.id}>
                      <ListingRow listing={listing} />
                    </li>
                  ))}
                </ul>
              ))}

            {activeTab === "purchases" &&
              (safePurchases.length === 0 ? (
                <EmptyState message="Aún no tienes compras." />
              ) : (
                <ul className="space-y-3">
                  {safePurchases.map((listing) => (
                    <li key={listing.id}>
                      <ListingRow listing={listing} />
                    </li>
                  ))}
                </ul>
              ))}

            {activeTab === "favorites" &&
              (safeFavorites.length === 0 ? (
                <EmptyState message="Aún no tienes favoritos." />
              ) : (
                <ul className="space-y-3">
                  {safeFavorites.map((listing) => (
                    <li key={listing.id}>
                      <ListingRow listing={listing} />
                    </li>
                  ))}
                </ul>
              ))}

            {activeTab === "messages" &&
              (safeConversations.length === 0 ? (
                <EmptyState message="Aún no tienes mensajes." />
              ) : (
                <ul className="space-y-3">
                  {safeConversations.map((conversation) => (
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
        className="btn-ghost mt-8 w-full py-3 text-sm text-destructive hover:border-destructive/30 hover:bg-destructive/5 sm:hidden"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
