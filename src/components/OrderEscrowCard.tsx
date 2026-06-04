import { formatMessageTime, formatPriceCLP } from "@/lib/format";
import {
  isFundsHeld,
  isFundsReleased,
  isRefunded,
  normalizePaymentStatus,
  orderAmountPaidClp,
  orderPlatformFeeClp,
  orderSellerAmountClp,
  paymentStatusDescription,
  paymentStatusLabel,
} from "@/lib/escrow";
import type { Order } from "@/types";

interface OrderEscrowCardProps {
  order: Order;
}

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
      className="rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-violet-950/50 via-fuchsia-950/25 to-[#0d0a14] p-5 shadow-lg shadow-violet-950/30 sm:p-6"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fuchsia-300/90">
        Compra Segura Melómanos
      </p>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
          <dt className="text-zinc-500">Valor vinilo</dt>
          <dd className="font-medium text-white">
            {formatPriceCLP(order.listing_price_clp)}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
          <dt className="text-zinc-500">Cargo Compra Segura</dt>
          <dd className="font-medium text-white">
            {formatPriceCLP(orderPlatformFeeClp(order))}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
          <dt className="text-zinc-500">Total pagado</dt>
          <dd className="text-lg font-bold text-violet-100">
            {formatPriceCLP(orderAmountPaidClp(order))}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
          <dt className="text-zinc-500">Monto vendedor</dt>
          <dd className="font-medium text-white">
            {formatPriceCLP(orderSellerAmountClp(order))}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">Estado fondos</dt>
          <dd>
            <span
              data-testid="order-escrow-payment-status"
              className="inline-block rounded-full bg-fuchsia-500/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-fuchsia-100 ring-1 ring-fuchsia-400/35"
            >
              {paymentStatusLabel(paymentStatus)}
            </span>
          </dd>
        </div>
      </dl>

      {contextMessage && (
        <p className="mt-4 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-relaxed text-zinc-300">
          {contextMessage}
        </p>
      )}

      {isFundsHeld(order) && order.funds_held_at && (
        <p className="mt-2 font-mono text-[10px] text-zinc-500">
          Fondos retenidos {formatMessageTime(order.funds_held_at)}
        </p>
      )}
      {isFundsReleased(order) && order.funds_released_at && (
        <p className="mt-2 font-mono text-[10px] text-zinc-500">
          Liberados {formatMessageTime(order.funds_released_at)}
        </p>
      )}
      {isRefunded(order) && order.refunded_at && (
        <p className="mt-2 font-mono text-[10px] text-zinc-500">
          Reembolsado {formatMessageTime(order.refunded_at)}
        </p>
      )}
    </section>
  );
}
