"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  completeOrder,
  getMe,
  getOrder,
  getToken,
  openDispute,
  setStoredUser,
  updateShipping,
} from "@/lib/api";
import { handleAuthRedirect, redirectToLogin } from "@/lib/auth-session";
import { formatMessageTime, formatPriceCLP, displayValue } from "@/lib/format";
import {
  isOrderBuyer,
  isOrderSeller,
  normalizeOrderStatus,
  orderListingTitle,
  orderStatusBadgeClass,
  orderStatusLabel,
  orderTimelineSteps,
  orderTotalClp,
  timelineStepIndex,
} from "@/lib/orders";
import type { Order, User } from "@/types";

export default function OrderDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const orderId = Number(params.id);

  const [user, setUser] = useState<User | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  const loadOrder = useCallback(async () => {
    if (Number.isNaN(orderId)) {
      setError("Pedido no válido.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await getOrder(orderId);
      setOrder(data);
      setCarrier(data.carrier ?? "");
      setTrackingNumber(data.tracking_number ?? "");
      setTrackingUrl(data.tracking_url ?? "");
    } catch (err) {
      if (handleAuthRedirect(err, router, pathname)) return;
      setOrder(null);
      setError(err instanceof Error ? err.message : "No se pudo cargar el pedido.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

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
      await loadOrder();
    }

    init();
  }, [router, loadOrder]);

  async function handleShippingSubmit(e: FormEvent) {
    e.preventDefault();
    if (!order) return;

    setBusy(true);
    setActionError("");
    try {
      const updated = await updateShipping(order.id, {
        carrier: carrier.trim() || undefined,
        tracking_number: trackingNumber.trim() || undefined,
        tracking_url: trackingUrl.trim() || undefined,
      });
      setOrder(updated);
      setCarrier(updated.carrier ?? "");
      setTrackingNumber(updated.tracking_number ?? "");
      setTrackingUrl(updated.tracking_url ?? "");
    } catch (err) {
      if (handleAuthRedirect(err, router, pathname)) return;
      setActionError(
        err instanceof Error ? err.message : "No se pudo guardar el tracking.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    if (!order) return;
    setBusy(true);
    setActionError("");
    try {
      const updated = await completeOrder(order.id);
      setOrder(updated);
    } catch (err) {
      if (handleAuthRedirect(err, router, pathname)) return;
      setActionError(
        err instanceof Error ? err.message : "No se pudo confirmar la recepción.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDispute() {
    if (!order) return;
    setBusy(true);
    setActionError("");
    try {
      const updated = await openDispute(order.id);
      setOrder(updated);
    } catch (err) {
      if (handleAuthRedirect(err, router, pathname)) return;
      setActionError(
        err instanceof Error ? err.message : "No se pudo reportar el problema.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading && !order) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-zinc-500">
        Cargando pedido…
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
        <Link href="/orders" className="mt-4 inline-block text-sm text-violet-300">
          ← Volver a pedidos
        </Link>
      </div>
    );
  }

  if (!order || !user) return null;

  const status = normalizeOrderStatus(order.status);
  const isBuyer = isOrderBuyer(order, user.id);
  const isSeller = isOrderSeller(order, user.id);
  const currentStep = timelineStepIndex(status);
  const steps = orderTimelineSteps();
  const canComplete =
    isBuyer &&
    (status === "shipped" || status === "delivered" || status === "paid");
  const canDispute =
    isBuyer && status !== "completed" && status !== "cancelled" && status !== "disputed";
  const canAddTracking = isSeller && status !== "cancelled" && status !== "completed";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/orders"
        className="font-mono text-xs uppercase tracking-wider text-violet-300 hover:text-violet-200"
      >
        ← Orders
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/90">
            Order #{order.id}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            {orderListingTitle(order)}
          </h1>
          {order.listing_artist && (
            <p className="mt-1 font-mono text-sm uppercase tracking-wide text-fuchsia-300/90">
              {order.listing_artist}
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${orderStatusBadgeClass(status)}`}
        >
          {orderStatusLabel(status)}
        </span>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
              Listing
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
                <dt className="text-zinc-500">Vinilo</dt>
                <dd className="text-right font-medium text-white">
                  <Link
                    href={`/listings/${order.listing_id}`}
                    className="text-violet-300 hover:text-violet-200"
                  >
                    {orderListingTitle(order)}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
                <dt className="text-zinc-500">Precio listing</dt>
                <dd className="font-medium text-white">
                  {formatPriceCLP(order.listing_price_clp)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
                <dt className="text-zinc-500">Envío</dt>
                <dd className="font-medium text-white">
                  {order.shipping_price_clp != null
                    ? formatPriceCLP(order.shipping_price_clp)
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Total</dt>
                <dd className="text-lg font-bold text-violet-100">
                  {formatPriceCLP(orderTotalClp(order))}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-950/30 to-transparent p-5 sm:p-6">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
              Status timeline
            </h2>

            {status === "disputed" || status === "cancelled" ? (
              <p className="mt-4 text-sm text-zinc-400">
                Este pedido está en estado{" "}
                <span className="font-semibold text-white">{orderStatusLabel(status)}</span>.
              </p>
            ) : (
              <ol className="mt-6 space-y-0">
                {steps.map((step, index) => {
                  const done = index <= currentStep;
                  const active = index === currentStep;

                  return (
                    <li key={step.status} className="relative flex gap-4 pb-8 last:pb-0">
                      {index < steps.length - 1 && (
                        <span
                          className={`absolute left-[11px] top-6 h-full w-px ${
                            done ? "bg-violet-500/50" : "bg-white/10"
                          }`}
                          aria-hidden
                        />
                      )}
                      <span
                        className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          active
                            ? "bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white ring-2 ring-fuchsia-400/40"
                            : done
                              ? "bg-violet-600/80 text-white"
                              : "border border-white/20 bg-black/40 text-zinc-500"
                        }`}
                      >
                        {done ? "✓" : index + 1}
                      </span>
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            active || done ? "text-white" : "text-zinc-500"
                          }`}
                        >
                          {step.label}
                        </p>
                        {active && (
                          <p className="mt-0.5 text-xs text-violet-300/80">Estado actual</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
              Tracking
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Carrier</dt>
                <dd className="text-white">{displayValue(order.carrier)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Tracking #</dt>
                <dd className="font-mono text-white">
                  {displayValue(order.tracking_number)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Tracking URL</dt>
                <dd className="text-right">
                  {order.tracking_url ? (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-300 hover:text-violet-200"
                    >
                      Abrir seguimiento
                    </a>
                  ) : (
                    <span className="text-zinc-500">—</span>
                  )}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0d0a14] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/90">
              Rol
            </p>
            <p className="mt-2 text-sm text-zinc-300">
              {isBuyer ? "Comprador" : isSeller ? "Vendedor" : "Participante"}
            </p>
            {order.updated_at && (
              <p className="mt-2 font-mono text-[10px] text-zinc-600">
                Actualizado {formatMessageTime(order.updated_at)}
              </p>
            )}
          </div>

          {actionError && (
            <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {actionError}
            </p>
          )}

          {canAddTracking && (
            <form
              onSubmit={handleShippingSubmit}
              className="rounded-2xl border border-fuchsia-500/20 bg-gradient-to-br from-violet-950/40 to-[#0d0a14] p-5"
            >
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300/90">
                Agregar tracking
              </h2>
              <label className="mt-4 block text-xs text-zinc-500">
                Carrier
                <input
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                  placeholder="Chilexpress, Starken…"
                />
              </label>
              <label className="mt-3 block text-xs text-zinc-500">
                Tracking number
                <input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="mt-3 block text-xs text-zinc-500">
                Tracking URL
                <input
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  type="url"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                  placeholder="https://…"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Guardando…" : "Guardar tracking"}
              </button>
            </form>
          )}

          {isBuyer && (
            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
                Acciones comprador
              </h2>
              <button
                type="button"
                onClick={handleComplete}
                disabled={busy || !canComplete}
                className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-50"
              >
                Confirmar recepción
              </button>
              <button
                type="button"
                onClick={handleDispute}
                disabled={busy || !canDispute}
                className="w-full rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                Reportar problema
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
