"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  completeOrder,
  createCheckoutSession,
  createReview,
  getMe,
  getMyShippingProfile,
  getOrder,
  getToken,
  setStoredUser,
  simulatePayment,
  updateShipping,
} from "@/lib/api";
import { handleAuthRedirect, redirectToLogin } from "@/lib/auth-session";
import { formatMessageTime, formatPriceCLP, displayValue } from "@/lib/format";
import {
  paymentStatusBadgeClass,
  paymentStatusLabel,
} from "@/lib/escrow";
import OrderDisputeSection from "@/components/OrderDisputeSection";
import OrderEscrowCard from "@/components/OrderEscrowCard";
import { formatReviewSubmitError } from "@/lib/reviews";
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
import { formatShippingProfileHint } from "@/lib/shipping-profile";
import {
  buildCheckoutReturnUrl,
  formatCheckoutError,
  orderCanStartWebPayCheckout,
  resolveCheckoutRedirectUrl,
  usesWebPayCheckout,
} from "@/lib/payments";
import type { Order, SellerShippingProfile, User } from "@/types";

const cardClass =
  "rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6";

const badgeClass =
  "rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset";

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60";

function orderDetailPageTitle(isBuyer: boolean, isSeller: boolean): string {
  if (isBuyer) return "Detalle de compra";
  if (isSeller) return "Detalle de venta";
  return "Detalle de transacción";
}

export default function OrderDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = Number(params.id);
  const checkoutReturnHandled = useRef(false);

  const [user, setUser] = useState<User | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [checkoutNotice, setCheckoutNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [shippingNotes, setShippingNotes] = useState("");
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSent, setReviewSent] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [sellerShippingProfile, setSellerShippingProfile] =
    useState<SellerShippingProfile | null>(null);
  const [requestDisputeForm, setRequestDisputeForm] = useState(false);

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
        try {
          const profile = await getMyShippingProfile();
          setSellerShippingProfile(profile);
        } catch {
          setSellerShippingProfile(null);
        }
      } catch (err) {
        if (handleAuthRedirect(err, router, pathname)) return;
        redirectToLogin(router, pathname);
        return;
      }
      await loadOrder();
    }

    init();
  }, [router, pathname, loadOrder]);

  useEffect(() => {
    if (checkoutReturnHandled.current || loading || !order) {
      return;
    }

    const checkout = searchParams.get("checkout");
    if (!checkout) {
      return;
    }

    checkoutReturnHandled.current = true;

    if (checkout === "success") {
      setCheckoutNotice("Pago enviado correctamente.");
      void refreshOrder();
    } else if (checkout === "cancelled") {
      setCheckoutNotice("Pago cancelado.");
    }

    router.replace(`/orders/${orderId}`, { scroll: false });
  }, [searchParams, loading, order, orderId, router, refreshOrder]);

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

  async function handleWebPayCheckout() {
    if (!order) return;

    setBusy(true);
    setActionError("");
    setCheckoutNotice("");
    try {
      const session = await createCheckoutSession(order.id, {
        returnUrl: buildCheckoutReturnUrl(order.id, "success"),
        cancelUrl: buildCheckoutReturnUrl(order.id, "cancelled"),
      });

      if (session.checkout_url) {
        window.location.href = resolveCheckoutRedirectUrl(session.checkout_url);
        return;
      }

      setActionError("Checkout URL not available.");
    } catch (err) {
      if (handleAuthRedirect(err, router, pathname)) return;
      setActionError(formatCheckoutError(err));
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

  async function handleReviewSubmit(e: FormEvent) {
    e.preventDefault();
    if (!order) return;

    if (rating < 1 || rating > 5) {
      setReviewError("Selecciona una calificación de 1 a 5 estrellas.");
      return;
    }

    setBusy(true);
    setReviewError("");
    setReviewSuccess("");

    try {
      await createReview({
        listing_id: order.listing_id,
        rating,
        comment: reviewComment.trim() || undefined,
      });
      setReviewSent(true);
      setReviewSuccess(
        "Review enviada. Gracias por fortalecer la comunidad Melómanos.",
      );
    } catch (err) {
      if (handleAuthRedirect(err, router, pathname)) return;
      setReviewError(formatReviewSubmitError(err));
    } finally {
      setBusy(false);
    }
  }

  function handleReportProblem() {
    setRequestDisputeForm(true);
    requestAnimationFrame(() => {
      document
        .querySelector("[data-testid='order-dispute-section']")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (loading && !order) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-muted-foreground">
        Cargando pedido…
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
        <Link
          href="/orders"
          data-testid="order-detail-back-link"
          className="mt-4 inline-block text-sm font-medium text-muted-foreground hover:text-accent"
        >
          ← Volver a compras y ventas
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
  const webPayCheckoutEnabled = usesWebPayCheckout();
  const showWebPayPaymentCard =
    isBuyer && orderCanStartWebPayCheckout(order) && webPayCheckoutEnabled;
  const showSimulatePaymentCard =
    isBuyer && orderNeedsPayment(status) && !webPayCheckoutEnabled;
  const showShippingForm = isSeller && status === "pending_shipping";
  const showBuyerPreparing = isBuyer && status === "pending_shipping";
  const showBuyerActions = isBuyer && status === "shipped";
  const showReviewForm = isBuyer && status === "completed" && !reviewSent;
  const showDisputeSection = isBuyer || isSeller;
  const shippingProfileHint =
    isSeller && showShippingForm
      ? formatShippingProfileHint(sellerShippingProfile)
      : null;
  const pageTitle = orderDetailPageTitle(isBuyer, isSeller);
  const checkoutNoticeSuccess = checkoutNotice.includes("correctamente");

  return (
    <div
      data-testid="order-detail-page"
      className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10"
    >
      <Link
        href="/orders"
        data-testid="order-detail-back-link"
        className="text-sm font-medium text-muted-foreground transition hover:text-accent"
      >
        ← Volver a compras y ventas
      </Link>

      <header className="mt-4">
        <p className="editorial-label text-accent">Transacción Melómanos</p>
        <h1
          data-testid="order-detail-title"
          className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          {pageTitle}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Revisa el estado, pago protegido y seguimiento de este vinilo.
        </p>
      </header>

      <aside
        data-testid="order-detail-trust-block"
        className="mt-6 rounded-2xl border border-border bg-surface-muted/40 px-5 py-4 shadow-[var(--shadow-card)] sm:px-6 sm:py-5"
      >
        <h2 className="text-sm font-semibold text-foreground">Pago protegido</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          El pago se mantiene protegido hasta que la recepción del vinilo sea
          confirmada o la transacción sea resuelta.
        </p>
      </aside>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px] lg:gap-8">
        <div className="min-w-0 space-y-6">
          <section data-testid="order-detail-summary" className={cardClass}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  Pedido #{order.id}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  {orderListingTitle(order)}
                </h2>
                {order.listing_artist && (
                  <p className="mt-1 text-sm font-medium uppercase tracking-[0.06em] text-muted-foreground">
                    {order.listing_artist}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span
                  data-testid="order-detail-status-badge"
                  className={`${badgeClass} ${orderStatusBadgeClass(status)}`}
                >
                  {orderStatusLabel(status)}
                </span>
                <span
                  data-testid="funds-status-badge"
                  className={`${badgeClass} ${paymentStatusBadgeClass(order.payment_status)}`}
                >
                  {paymentStatusLabel(order.payment_status)}
                </span>
              </div>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-border pb-3">
                <dt className="text-muted-foreground">Publicación</dt>
                <dd className="text-right font-medium text-foreground">
                  <Link
                    href={`/listings/${order.listing_id}`}
                    className="text-accent hover:underline"
                  >
                    {orderListingTitle(order)}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-3">
                <dt className="text-muted-foreground">Precio publicación</dt>
                <dd className="font-medium text-foreground">
                  {formatPriceCLP(order.listing_price_clp)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-3">
                <dt className="text-muted-foreground">Envío</dt>
                <dd className="font-medium text-foreground">
                  {order.shipping_price_clp != null
                    ? formatPriceCLP(order.shipping_price_clp)
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Total</dt>
                <dd className="text-xl font-bold text-foreground">
                  {formatPriceCLP(orderTotalClp(order))}
                </dd>
              </div>
            </dl>
          </section>

          <OrderEscrowCard order={order} />

          <section
            data-testid="order-detail-tracking"
            className={cardClass}
          >
            <h2 className="text-sm font-semibold text-foreground">Seguimiento</h2>

            {hasTracking ? (
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Transportista</dt>
                  <dd className="font-medium text-foreground">
                    {displayValue(order.carrier)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Número de seguimiento</dt>
                  <dd
                    data-testid="order-tracking-number"
                    className="font-mono text-foreground"
                  >
                    {displayValue(order.tracking_number)}
                  </dd>
                </div>
                {order.tracking_url?.trim() && (
                  <div className="flex justify-between gap-4 border-b border-border pb-3">
                    <dt className="text-muted-foreground">Enlace</dt>
                    <dd>
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-accent hover:underline"
                      >
                        Ver seguimiento
                      </a>
                    </dd>
                  </div>
                )}
                {order.shipping_notes?.trim() && (
                  <div>
                    <dt className="text-muted-foreground">Notas de envío</dt>
                    <dd className="mt-1 text-foreground">{order.shipping_notes}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                {isSeller && status === "pending_shipping"
                  ? "Completa el formulario de envío para registrar el seguimiento."
                  : "Sin seguimiento todavía"}
              </p>
            )}
          </section>

          <section className={cardClass}>
            <h2 className="text-sm font-semibold text-foreground">
              Estado del pedido
            </h2>

            {terminal ? (
              <div className="mt-5 rounded-xl border border-border bg-surface-muted/40 px-4 py-5">
                <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  Estado final
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {orderStatusLabel(status)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {status === "disputed"
                    ? "Este pedido está en revisión. Contacta al otro usuario si necesitas más detalles."
                    : status === "refunded"
                      ? "Este pedido fue reembolsado."
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
                            done ? "bg-success/40" : "bg-border"
                          }`}
                          aria-hidden
                        />
                      )}
                      <span
                        className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          active
                            ? "bg-accent text-primary-foreground ring-2 ring-accent/30"
                            : done
                              ? "bg-success/15 text-success ring-1 ring-success/30"
                              : "border border-border bg-surface text-muted-foreground"
                        }`}
                      >
                        {done ? "✓" : index + 1}
                      </span>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-semibold ${
                            active || done ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {phase.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {phase.hint}
                        </p>
                        {active && (
                          <p
                            className={`mt-2 inline-block ${badgeClass} ${orderStatusBadgeClass(status)}`}
                          >
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

          {checkoutNotice && (
            <p
              data-testid="order-checkout-notice"
              className={`rounded-xl border px-4 py-3 text-sm ${
                checkoutNoticeSuccess
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-amber-600/25 bg-amber-600/10 text-amber-900"
              }`}
            >
              {checkoutNotice}
            </p>
          )}

          {showWebPayPaymentCard && (
            <section className={cardClass}>
              <h2 className="text-sm font-semibold text-foreground">
                Pago pendiente
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Completa el pago con WebPay para activar Compra Segura.
              </p>
              <button
                type="button"
                data-testid="order-checkout-webpay"
                onClick={handleWebPayCheckout}
                disabled={busy}
                className="btn-primary mt-5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Iniciando pago…" : "Pagar con WebPay"}
              </button>
            </section>
          )}

          {showSimulatePaymentCard && (
            <section className={cardClass}>
              <h2 className="text-sm font-semibold text-foreground">
                Pago pendiente
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Confirma el pago simulado para activar Compra Segura.
              </p>
              <button
                type="button"
                data-testid="order-confirm-payment"
                onClick={handleConfirmPayment}
                disabled={busy}
                className="btn-primary mt-5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Confirmando…" : "Confirmar pago"}
              </button>
            </section>
          )}

          {showShippingForm && (
            <form
              data-testid="order-shipping-form"
              onSubmit={handleShippingSubmit}
              className={cardClass}
            >
              <h2 className="text-sm font-semibold text-foreground">
                Agregar seguimiento
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Pago confirmado. Los fondos están retenidos por Melómanos hasta que
                el comprador confirme recepción. Ingresa los datos de envío para
                continuar.
              </p>
              {shippingProfileHint && (
                <p
                  data-testid="order-seller-shipping-profile-hint"
                  className="mt-3 rounded-lg border border-border bg-surface-muted/40 px-3 py-2 text-xs text-muted-foreground"
                >
                  {shippingProfileHint}
                </p>
              )}
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-medium text-foreground sm:col-span-1">
                  Transportista *
                  <input
                    data-testid="order-shipping-carrier"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    required
                    disabled={busy}
                    className={inputClass}
                    placeholder="Chilexpress, Starken…"
                  />
                </label>
                <label className="block text-xs font-medium text-foreground sm:col-span-1">
                  Código de seguimiento *
                  <input
                    data-testid="order-shipping-tracking"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    required
                    disabled={busy}
                    className={inputClass}
                    placeholder="ABC123456789"
                  />
                </label>
                <label className="block text-xs font-medium text-foreground sm:col-span-2">
                  URL de seguimiento (opcional)
                  <input
                    data-testid="order-shipping-url"
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    type="url"
                    disabled={busy}
                    className={inputClass}
                    placeholder="https://…"
                  />
                </label>
                <label className="block text-xs font-medium text-foreground sm:col-span-2">
                  Notas de envío (opcional)
                  <textarea
                    data-testid="order-shipping-notes"
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
                data-testid="order-confirm-shipping"
                disabled={busy}
                className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {busy ? "Confirmando…" : "Confirmar envío"}
              </button>
            </form>
          )}

          {showBuyerPreparing && (
            <section className={cardClass}>
              <p className="text-xs font-medium uppercase tracking-[0.06em] text-accent">
                En preparación
              </p>
              <p className="mt-2 text-sm text-foreground">
                El vendedor está preparando el envío.
              </p>
            </section>
          )}

          {showBuyerActions && (
            <section className={cardClass}>
              <p className="text-xs font-medium uppercase tracking-[0.06em] text-accent">
                En camino
              </p>
              <p className="mt-2 text-sm text-foreground">Tu vinilo va en camino.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  data-testid="order-confirm-reception"
                  onClick={handleComplete}
                  disabled={busy}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Confirmar recepción
                </button>
                <button
                  type="button"
                  data-testid="order-report-problem"
                  onClick={handleReportProblem}
                  disabled={busy}
                  className="rounded-lg border border-destructive/30 bg-destructive/5 px-5 py-2.5 text-sm font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
                >
                  Reportar problema
                </button>
              </div>
            </section>
          )}

          {showReviewForm && (
            <form
              data-testid="order-review-form"
              onSubmit={handleReviewSubmit}
              className={cardClass}
            >
              <h2 className="text-sm font-semibold text-foreground">
                Califica al vendedor
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Tu compra fue completada. Ayuda a otros coleccionistas compartiendo tu
                experiencia.
              </p>

              <fieldset className="mt-5">
                <legend className="text-xs font-medium text-muted-foreground">
                  Calificación *
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const selected = rating >= value;
                    return (
                      <button
                        key={value}
                        type="button"
                        data-testid={`order-review-star-${value}`}
                        onClick={() => {
                          setRating(value);
                          setReviewError("");
                        }}
                        disabled={busy}
                        aria-label={`${value} estrella${value > 1 ? "s" : ""}`}
                        className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xl transition ${
                          selected
                            ? "border-accent/50 bg-accent/15 text-accent"
                            : "border-border bg-surface text-muted-foreground hover:border-accent/40"
                        }`}
                      >
                        ★
                      </button>
                    );
                  })}
                  <span className="self-center text-sm text-muted-foreground">
                    {rating > 0 ? `${rating}/5` : "Elige 1–5"}
                  </span>
                </div>
              </fieldset>

              <label className="mt-5 block text-xs font-medium text-foreground">
                Comentario (opcional)
                <textarea
                  data-testid="order-review-comment"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  disabled={busy}
                  className={`${inputClass} resize-y`}
                  placeholder="¿Cómo fue el empaque, la comunicación, el estado del disco?"
                />
              </label>

              {reviewError && (
                <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {reviewError}
                </p>
              )}

              <button
                type="submit"
                data-testid="order-review-submit"
                disabled={busy}
                className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {busy ? "Enviando…" : "Enviar review"}
              </button>
            </form>
          )}

          {reviewSuccess && (
            <p
              data-testid="order-review-success"
              className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
            >
              {reviewSuccess}
            </p>
          )}

          {showDisputeSection && (
            <OrderDisputeSection
              order={order}
              user={user}
              onOrderRefresh={async () => {
                await refreshOrder();
              }}
              showOpenForm={requestDisputeForm}
              onOpenFormShown={() => setRequestDisputeForm(false)}
            />
          )}
        </div>

        <aside className="space-y-4">
          <div className={`${cardClass} !p-4`}>
            <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Rol
            </p>
            <p className="mt-2 text-sm text-foreground">
              {isBuyer ? "Comprador" : isSeller ? "Vendedor" : "Participante"}
            </p>
            {order.created_at && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Creado {formatMessageTime(order.created_at)}
              </p>
            )}
            {order.updated_at && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Actualizado {formatMessageTime(order.updated_at)}
              </p>
            )}
          </div>

          {actionError && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {actionError}
            </p>
          )}

          {isSeller && status === "shipped" && (
            <p className="rounded-xl border border-border bg-surface-muted/40 px-4 py-3 text-xs text-muted-foreground">
              Envío confirmado. Espera a que el comprador confirme la recepción.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
