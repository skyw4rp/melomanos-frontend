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
  simulatePayment,
  updateShipping,
} from "@/lib/api";
import { handleAuthRedirect, redirectToLogin } from "@/lib/auth-session";
import { formatMessageTime, formatPriceCLP, displayValue } from "@/lib/format";
import {
  isOrderBuyer,
  isOrderSeller,
  isTerminalOrderStatus,
  normalizeOrderStatus,
  orderHasTracking,
  orderNeedsPayment,
  orderListingTitle,
  orderStatusBadgeClass,
  orderStatusLabel,
  orderTimelinePhases,
  orderTotalClp,
  timelinePhaseState,
} from "@/lib/orders";
import type { Order, User } from "@/types";

const inputClass =
  "mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-60";

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
  const [shippingNotes, setShippingNotes] = useState("");

  const applyOrderState = useCallback((data: Order) => {
    setOrder(data);
    setCarrier(data.carrier ?? "");
    setTrackingNumber(data.tracking_number ?? "");
    setTrackingUrl(data.tracking_url ?? "");
    setShippingNotes(data.shipping_notes ?? "");
  }, []);

  const refreshOrder = useCallback(async () => {
    const refreshed = await getOrder(orderId);
    applyOrderState(refreshed);
    return refreshed;
  }, [orderId, applyOrderState]);

  const loadOrder = useCallback(async () => {
    if (Number.isNaN(orderId)) {
      setError("Pedido no válido.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      await refreshOrder();
    } catch (err) {
      if (handleAuthRedirect(err, router, pathname)) return;
      setOrder(null);
      setError(err instanceof Error ? err.message : "No se pudo cargar el pedido.");
    } finally {
      setLoading(false);
    }
  }, [orderId, pathname, router, refreshOrder]);

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
  }, [router, pathname, loadOrder]);

  async function handleConfirmPayment() {
    if (!order) return;

    setBusy(true);
    setActionError("");
    try {
      await simulatePayment(order.id);
      await refreshOrder();
    } catch (err) {
      if (handleAuthRedirect(err, router, pathname)) return;
      setActionError(
        err instanceof Error ? err.message : "No se pudo confirmar el pago.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleShippingSubmit(e: FormEvent) {
    e.preventDefault();
    if (!order) return;

    if (!carrier.trim() || !trackingNumber.trim()) {
      setActionError("Empresa y código de seguimiento son obligatorios.");
      return;
    }

    setBusy(true);
    setActionError("");
    try {
      await updateShipping(order.id, {
        carrier: carrier.trim(),
        tracking_number: trackingNumber.trim(),
        tracking_url: trackingUrl.trim() || undefined,
        shipping_notes: shippingNotes.trim() || undefined,
      });
      await refreshOrder();
    } catch (err) {
      if (handleAuthRedirect(err, router, pathname)) return;
      setActionError(
        err instanceof Error ? err.message : "No se pudo confirmar el envío.",
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
      await completeOrder(order.id);
      await refreshOrder();
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
      await openDispute(order.id);
      await refreshOrder();
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
  const terminal = isTerminalOrderStatus(status);
  const phases = orderTimelinePhases();
  const hasTracking = orderHasTracking(order);
  const showPaymentCard = isBuyer && orderNeedsPayment(status);
  const showShippingForm = isSeller && status === "pending_shipping";
  const showBuyerPreparing = isBuyer && status === "pending_shipping";
  const showBuyerActions = isBuyer && status === "shipped";

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
              Estado del pedido
            </h2>

            {terminal ? (
              <div className="mt-6 rounded-xl border border-white/10 bg-black/20 px-4 py-5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  Estado final
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {orderStatusLabel(status)}
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  {status === "disputed"
                    ? "Este pedido está en revisión. Contacta al otro usuario si necesitas más detalles."
                    : "Este pedido fue cancelado y ya no avanzará en el flujo."}
                </p>
              </div>
            ) : (
              <ol className="mt-6 space-y-0">
                {phases.map((phase, index) => {
                  const phaseState = timelinePhaseState(phase, status);
                  const done = phaseState === "done";
                  const active = phaseState === "current";

                  return (
                    <li
                      key={phase.key}
                      className="relative flex gap-4 pb-8 last:pb-0"
                    >
                      {index < phases.length - 1 && (
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
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-semibold ${
                            active || done ? "text-white" : "text-zinc-500"
                          }`}
                        >
                          {phase.title}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">{phase.hint}</p>
                        {active && (
                          <p className="mt-2 inline-block rounded-full bg-fuchsia-500/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-fuchsia-200">
                            {orderStatusLabel(status)}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {showPaymentCard && (
            <section className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-950/30 via-violet-950/20 to-transparent p-5 sm:p-6">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/90">
                Pago pendiente
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                Confirma el pago para que el vendedor pueda preparar el envío.
              </p>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={busy}
                className="mt-5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50"
              >
                {busy ? "Confirmando…" : "Confirmar pago"}
              </button>
            </section>
          )}

          {showShippingForm && (
            <form
              onSubmit={handleShippingSubmit}
              className="rounded-2xl border-2 border-fuchsia-500/35 bg-gradient-to-br from-fuchsia-950/40 via-violet-950/50 to-[#0d0a14] p-5 shadow-xl shadow-fuchsia-950/30 sm:p-6"
            >
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300">
                Agregar seguimiento
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                El comprador ya confirmó el pago. Ingresa los datos de envío para
                continuar.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block text-xs text-zinc-500 sm:col-span-1">
                  Empresa *
                  <input
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    required
                    disabled={busy}
                    className={inputClass}
                    placeholder="Chilexpress, Starken…"
                  />
                </label>
                <label className="block text-xs text-zinc-500 sm:col-span-1">
                  Código de seguimiento *
                  <input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    required
                    disabled={busy}
                    className={inputClass}
                    placeholder="ABC123456789"
                  />
                </label>
                <label className="block text-xs text-zinc-500 sm:col-span-2">
                  URL de seguimiento (opcional)
                  <input
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    type="url"
                    disabled={busy}
                    className={inputClass}
                    placeholder="https://…"
                  />
                </label>
                <label className="block text-xs text-zinc-500 sm:col-span-2">
                  Notas de envío (opcional)
                  <textarea
                    value={shippingNotes}
                    onChange={(e) => setShippingNotes(e.target.value)}
                    rows={3}
                    disabled={busy}
                    className={`${inputClass} resize-y`}
                    placeholder="Instrucciones o detalles para el comprador…"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 sm:w-auto sm:px-10"
              >
                {busy ? "Confirmando…" : "Confirmar envío"}
              </button>
            </form>
          )}

          {showBuyerPreparing && (
            <section className="rounded-2xl border border-violet-500/25 bg-violet-950/30 p-5 sm:p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-300/90">
                En preparación
              </p>
              <p className="mt-2 text-sm text-zinc-200">
                El vendedor está preparando el envío.
              </p>
            </section>
          )}

          {showBuyerActions && (
            <section className="rounded-2xl border border-fuchsia-500/20 bg-gradient-to-br from-violet-950/40 to-transparent p-5 sm:p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fuchsia-300/90">
                En camino
              </p>
              <p className="mt-2 text-sm text-zinc-200">Tu vinilo va en camino.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={busy}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  Confirmar recepción
                </button>
                <button
                  type="button"
                  onClick={handleDispute}
                  disabled={busy}
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
                >
                  Reportar problema
                </button>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
              Seguimiento
            </h2>

            {hasTracking ? (
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
                  <dt className="text-zinc-500">Empresa</dt>
                  <dd className="font-medium text-white">
                    {displayValue(order.carrier)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
                  <dt className="text-zinc-500">Código seguimiento</dt>
                  <dd className="font-mono text-white">
                    {displayValue(order.tracking_number)}
                  </dd>
                </div>
                {order.tracking_url?.trim() && (
                  <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
                    <dt className="text-zinc-500">Enlace</dt>
                    <dd>
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-violet-300 hover:text-violet-200"
                      >
                        Ver seguimiento
                      </a>
                    </dd>
                  </div>
                )}
                {order.shipping_notes?.trim() && (
                  <div>
                    <dt className="text-zinc-500">Notas de envío</dt>
                    <dd className="mt-1 text-zinc-300">{order.shipping_notes}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="mt-4 text-sm text-zinc-400">
                {isSeller && status === "pending_shipping"
                  ? "Completa el formulario de arriba para registrar el envío."
                  : "El vendedor aún no ha ingresado el seguimiento."}
              </p>
            )}
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

          {isSeller && status === "shipped" && (
            <p className="rounded-xl border border-violet-500/20 bg-violet-950/30 px-4 py-3 text-xs text-violet-200/90">
              Envío confirmado. Espera a que el comprador confirme la recepción.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
