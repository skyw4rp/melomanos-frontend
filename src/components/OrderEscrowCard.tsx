import { formatMessageTime, formatPriceCLP } from "@/lib/format";
import {
  isFundsHeld,
  isFundsReleased,
  isRefunded,
  normalizePaymentStatus,
  orderAmountPaidClp,
  orderPlatformFeeClp,
  orderSellerAmountClp,
  paymentStatusBadgeClass,
  paymentStatusDescription,
  paymentStatusLabel,
} from "@/lib/escrow";
import type { Order } from "@/types";

interface OrderEscrowCardProps {
  order: Order;
}

const badgeClass =
  "inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset";

function escrowContextMessage(order: Order): string | null {
  const status = normalizePaymentStatus(order.payment_status);
  if (status === "held") {
    return "Melómanos mantiene los fondos retenidos hasta que confirmes la recepción.";
  }
  if (status === "released") {
    return "Fondos liberados al vendedor.";
  }
  if (status === "refunded") {
    return "Pago reembolsado.";
  }
  return paymentStatusDescription(status);
}

export default function OrderEscrowCard({ order }: OrderEscrowCardProps) {
  const paymentStatus = normalizePaymentStatus(order.payment_status);
  const contextMessage = escrowContextMessage(order);

  return (
    <section
      data-testid="order-escrow-card"
      className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6"
    >
      <h2 className="text-sm font-semibold text-foreground">
        Pago protegido Melómanos
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Desglose de Compra Segura y estado de fondos.
      </p>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-border pb-3">
          <dt className="text-muted-foreground">Valor vinilo</dt>
          <dd className="font-medium text-foreground">
            {formatPriceCLP(order.listing_price_clp)}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border pb-3">
          <dt className="text-muted-foreground">Cargo Compra Segura</dt>
          <dd className="font-medium text-foreground">
            {formatPriceCLP(orderPlatformFeeClp(order))}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border pb-3">
          <dt className="text-muted-foreground">Total pagado</dt>
          <dd className="text-lg font-bold text-foreground">
            {formatPriceCLP(orderAmountPaidClp(order))}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border pb-3">
          <dt className="text-muted-foreground">Monto vendedor</dt>
          <dd className="font-medium text-foreground">
            {formatPriceCLP(orderSellerAmountClp(order))}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Estado fondos</dt>
          <dd>
            <span
              data-testid="order-detail-funds-badge"
              className={`${badgeClass} ${paymentStatusBadgeClass(paymentStatus)}`}
            >
              {paymentStatusLabel(paymentStatus)}
            </span>
          </dd>
        </div>
      </dl>

      {contextMessage && (
        <p className="mt-4 rounded-xl border border-border bg-surface-muted/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          {contextMessage}
        </p>
      )}

      {isFundsHeld(order) && order.funds_held_at && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Fondos retenidos {formatMessageTime(order.funds_held_at)}
        </p>
      )}
      {isFundsReleased(order) && order.funds_released_at && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Liberados {formatMessageTime(order.funds_released_at)}
        </p>
      )}
      {isRefunded(order) && order.refunded_at && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Reembolsado {formatMessageTime(order.refunded_at)}
        </p>
      )}
    </section>
  );
}
