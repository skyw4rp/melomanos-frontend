"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getBuyingOrders, getSellingOrders, getToken } from "@/lib/api";
import { handleAuthRedirect, redirectToLogin } from "@/lib/auth-session";
import { formatPriceCLP } from "@/lib/format";
import {
  paymentStatusBadgeClass,
  paymentStatusLabel,
} from "@/lib/escrow";
import {
  orderListingTitle,
  orderStatusBadgeClass,
  orderStatusLabel,
  orderTotalClp,
} from "@/lib/orders";
import type { Order } from "@/types";

type TabId = "buying" | "selling";

const tabs: { id: TabId; label: string; testId: string }[] = [
  { id: "buying", label: "Compras", testId: "orders-tab-purchases" },
  { id: "selling", label: "Ventas", testId: "orders-tab-sales" },
];

const badgeClass =
  "rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset";

function OrderCard({ order }: { order: Order }) {
  const title = orderListingTitle(order);
  const hasTracking = Boolean(order.tracking_number || order.tracking_url);

  return (
    <Link
      href={`/orders/${order.id}`}
      data-testid="order-card"
      className="block rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] transition hover:border-accent/40 hover:shadow-[var(--shadow-card-hover)] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-foreground">
            {title}
          </p>
          {order.listing_artist && (
            <p className="mt-0.5 truncate text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
              {order.listing_artist}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Pedido #{order.id}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            data-testid="order-status-badge"
            className={`${badgeClass} ${orderStatusBadgeClass(order.status)}`}
          >
            {orderStatusLabel(order.status)}
          </span>
          <span
            data-testid="funds-status-badge"
            className={`${badgeClass} ${paymentStatusBadgeClass(order.payment_status)}`}
          >
            {paymentStatusLabel(order.payment_status)}
          </span>
        </div>
      </div>

      <p className="mt-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {formatPriceCLP(orderTotalClp(order))}
      </p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {order.carrier && (
          <span>
            <span className="text-foreground/70">Transportista · </span>
            {order.carrier}
          </span>
        )}
        {hasTracking && (
          <span>
            <span className="text-foreground/70">Seguimiento · </span>
            {order.tracking_number || "Enlace disponible"}
          </span>
        )}
        {!order.carrier && !hasTracking && (
          <span>Sin seguimiento todavía</span>
        )}
      </div>
    </Link>
  );
}

function OrdersEmptyState({ tab }: { tab: TabId }) {
  const isBuying = tab === "buying";

  return (
    <div
      data-testid={isBuying ? "orders-empty-purchases" : "orders-empty-sales"}
      className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center shadow-[var(--shadow-card)]"
    >
      <p className="text-base font-semibold text-foreground">
        {isBuying ? "Aún no tienes compras" : "Aún no tienes ventas"}
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {isBuying
          ? "Cuando compres un vinilo, aparecerá aquí el seguimiento de tu pedido."
          : "Cuando alguien compre una de tus publicaciones, aparecerá aquí."}
      </p>
      {isBuying && (
        <Link href="/" className="btn-primary mt-6 inline-flex px-5 py-2.5 text-sm">
          Explorar catálogo
        </Link>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabId>("buying");
  const [buying, setBuying] = useState<Order[]>([]);
  const [selling, setSelling] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [buyData, sellData] = await Promise.all([
        getBuyingOrders(),
        getSellingOrders(),
      ]);
      setBuying(Array.isArray(buyData) ? buyData : []);
      setSelling(Array.isArray(sellData) ? sellData : []);
    } catch (err) {
      if (handleAuthRedirect(err, router, pathname)) return;
      setError(err instanceof Error ? err.message : "No se pudieron cargar los pedidos.");
    } finally {
      setLoading(false);
    }
  }, [router, pathname]);

  useEffect(() => {
    if (!getToken()) {
      redirectToLogin(router, pathname);
      return;
    }
    loadOrders();
  }, [router, pathname, loadOrders]);

  const orders = activeTab === "buying" ? buying : selling;

  return (
    <div
      data-testid="orders-page"
      className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10"
    >
      <Link
        href="/"
        data-testid="orders-back-link"
        className="text-sm font-medium text-muted-foreground transition hover:text-accent"
      >
        ← Volver al catálogo
      </Link>

      <header className="mt-4">
        <p className="editorial-label text-accent">Transacciones Melómanos</p>
        <h1
          data-testid="orders-page-title"
          className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          Compras y ventas
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Revisa el estado de tus compras, ventas y pagos protegidos.
        </p>
      </header>

      <aside
        data-testid="orders-trust-block"
        className="mt-6 rounded-2xl border border-border bg-surface-muted/40 px-5 py-4 shadow-[var(--shadow-card)] sm:px-6 sm:py-5"
      >
        <h2 className="text-sm font-semibold text-foreground">
          Compra protegida Melómanos
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Tu pago se mantiene protegido hasta confirmar la recepción del vinilo.
          Si algo no está bien, puedes revisar el estado de la compra desde esta
          sección.
        </p>
      </aside>

      {error && (
        <p
          className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="mt-8 flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-testid={tab.testId}
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section data-testid="orders-list-section" className="mt-6">
        {loading && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Cargando pedidos…
          </p>
        )}

        {!loading && orders.length === 0 && (
          <OrdersEmptyState tab={activeTab} />
        )}

        {!loading && orders.length > 0 && (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.id}>
                <OrderCard order={order} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
