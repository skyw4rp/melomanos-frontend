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

const tabs: { id: TabId; label: string }[] = [
  { id: "buying", label: "Compras" },
  { id: "selling", label: "Ventas" },
];

function OrderCard({ order }: { order: Order }) {
  const title = orderListingTitle(order);
  const hasTracking = Boolean(order.tracking_number || order.tracking_url);

  return (
    <Link
      href={`/orders/${order.id}`}
      className="block rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-violet-400/40 hover:bg-white/[0.06]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{title}</p>
          {order.listing_artist && (
            <p className="mt-0.5 truncate font-mono text-xs uppercase tracking-wide text-fuchsia-300/80">
              {order.listing_artist}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${orderStatusBadgeClass(order.status)}`}
          >
            {orderStatusLabel(order.status)}
          </span>
          <span
            data-testid="order-list-payment-badge"
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${paymentStatusBadgeClass(order.payment_status)}`}
          >
            {paymentStatusLabel(order.payment_status)}
          </span>
        </div>
      </div>

      <p className="mt-3 text-lg font-bold text-violet-100">
        {formatPriceCLP(orderTotalClp(order))}
      </p>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
        {order.carrier && (
          <span>
            <span className="text-zinc-600">Carrier · </span>
            {order.carrier}
          </span>
        )}
        {hasTracking && (
          <span>
            <span className="text-zinc-600">Tracking · </span>
            {order.tracking_number || "Link disponible"}
          </span>
        )}
        {!order.carrier && !hasTracking && (
          <span className="text-zinc-600">Sin tracking aún</span>
        )}
      </div>
    </Link>
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
  }, []);

  useEffect(() => {
    if (!getToken()) {
      redirectToLogin(router, pathname);
      return;
    }
    loadOrders();
  }, [router, loadOrders]);

  const orders = activeTab === "buying" ? buying : selling;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="font-mono text-xs uppercase tracking-wider text-violet-300 hover:text-violet-200"
      >
        ← Marketplace
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Orders</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Compras y ventas estilo pulga — seguimiento y estado del vinilo.
      </p>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="mt-8 flex gap-1 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "border-fuchsia-400 text-white"
                : "border-transparent text-zinc-400 hover:text-violet-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="mt-6">
        {loading && (
          <p className="py-12 text-center text-sm text-zinc-500">Cargando pedidos…</p>
        )}

        {!loading && orders.length === 0 && (
          <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center text-sm text-zinc-400">
            {activeTab === "buying"
              ? "Aún no tienes compras."
              : "Aún no tienes ventas."}
          </p>
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
