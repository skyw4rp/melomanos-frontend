"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReducer, useRef, useState } from "react";
import MessageForm from "@/components/MessageForm";
import { IconHeart } from "@/components/icons";
import { isOwnListing } from "@/lib/auth";
import { createOrderFromListing, addFavorite, getStoredUser, getToken } from "@/lib/api";
import { DEFAULT_PLATFORM_FEE_CLP } from "@/lib/escrow";
import { formatPriceCLP } from "@/lib/format";

interface ListingDetailActionsProps {
  listingId: number;
  status?: string;
  sellerId?: number;
  listingTitle: string;
  priceClp: number;
}

type ActionState = "idle" | "loading" | "done" | "error";

export interface PurchaseState {
  confirmationOpen: boolean;
  status: ActionState;
  error: string;
}

export const initialPurchaseState: PurchaseState = {
  confirmationOpen: false,
  status: "idle",
  error: "",
};

export function purchaseReducer(
  state: PurchaseState,
  action:
    | { type: "open" }
    | { type: "cancel" }
    | { type: "pending" }
    | { type: "error"; message: string },
): PurchaseState {
  switch (action.type) {
    case "open":
      return { confirmationOpen: true, status: "idle", error: "" };
    case "cancel":
      return initialPurchaseState;
    case "pending":
      return { ...state, status: "loading", error: "" };
    case "error":
      return { ...state, status: "error", error: action.message };
  }
}

export async function runOrderCreationRequest({
  createOrder,
  onLoading,
  onClearError,
  onSuccess,
  onError,
}: {
  createOrder: () => Promise<{ id: number }>;
  onLoading: () => void;
  onClearError: () => void;
  onSuccess: (order: { id: number }) => void;
  onError: (message: string) => void;
}): Promise<void> {
  onLoading();
  onClearError();
  try {
    onSuccess(await createOrder());
  } catch (err) {
    onError(err instanceof Error ? err.message : "No se pudo crear el pedido");
  }
}

export default function ListingDetailActions({
  listingId,
  status,
  sellerId,
  listingTitle,
  priceClp,
}: ListingDetailActionsProps) {
  const router = useRouter();
  const currentUser = getStoredUser();
  const isOwner = isOwnListing({ seller_id: sellerId }, currentUser);
  const [showMessage, setShowMessage] = useState(false);
  const [favState, setFavState] = useState<ActionState>("idle");
  const [purchase, dispatchPurchase] = useReducer(purchaseReducer, initialPurchaseState);
  const orderCreationInFlight = useRef(false);

  const safeStatus = (status ?? "available").toLowerCase();
  const isReserved = safeStatus === "reserved";
  const isSold = safeStatus === "sold";

  function requireAuth(): boolean {
    if (getToken()) return true;
    router.push("/login");
    return false;
  }

  async function handleFavorite() {
    if (!requireAuth()) return;
    setFavState("loading");
    try {
      await addFavorite(listingId);
      setFavState("done");
    } catch {
      setFavState("error");
    }
  }

  function handlePurchaseStart() {
    if (!requireAuth() || isReserved || isSold) return;
    dispatchPurchase({ type: "open" });
  }

  async function handlePurchaseConfirm() {
    if (orderCreationInFlight.current) return;
    orderCreationInFlight.current = true;
    await runOrderCreationRequest({
      createOrder: () => createOrderFromListing(listingId),
      onLoading: () => dispatchPurchase({ type: "pending" }),
      onClearError: () => undefined,
      onSuccess: (order) => router.push(`/orders/${order.id}`),
      onError: (message) => {
        dispatchPurchase({ type: "error", message });
      },
    });
    orderCreationInFlight.current = false;
  }

  if (isOwner) {
    return (
      <div className="px-1 py-1">
        <p className="badge-gold w-fit">Tu publicación</p>
        <p className="mt-3 text-lg font-semibold text-foreground">Esta es tu publicación</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Cuando un comprador confirme la compra, se creará un pedido y la publicación quedará reservada para esa transacción.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          {!isSold && (
            <Link
              href={`/listings/${listingId}/edit`}
              data-testid="listing-edit-link"
              className="inline-flex text-sm font-semibold text-accent transition-ui hover:text-foreground"
            >
              Editar publicación →
            </Link>
          )}
          <Link href="/orders" className="inline-flex text-sm font-semibold text-accent transition-ui hover:text-foreground">
            Ver pedidos →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
        <button
          type="button"
          onClick={handlePurchaseStart}
          disabled={isReserved || isSold}
          className="btn-primary order-1 py-2.5 text-sm font-semibold uppercase tracking-wide disabled:opacity-50 sm:order-3"
        >
          {isSold ? "Vendido" : isReserved ? "Reservado" : "Comprar"}
        </button>
        <button
          type="button"
          onClick={handleFavorite}
          disabled={favState === "loading" || favState === "done"}
          className="btn-ghost order-2 py-2.5 text-sm font-semibold uppercase tracking-wide disabled:opacity-60 sm:order-1"
        >
          {favState === "done" ? (
            <span className="inline-flex items-center gap-1.5"><IconHeart className="h-4 w-4 fill-accent text-accent" aria-hidden />En favoritos</span>
          ) : favState === "loading" ? "…" : (
            <span className="inline-flex items-center gap-1.5"><IconHeart className="h-4 w-4" aria-hidden />Guardar</span>
          )}
        </button>
        <button
          type="button"
          data-testid="listing-message-toggle"
          onClick={() => { if (requireAuth()) setShowMessage((value) => !value); }}
          className="btn-ghost order-3 py-2.5 text-sm font-semibold uppercase tracking-wide sm:order-2"
        >
          Enviar mensaje
        </button>
      </div>

      {favState === "error" && <p className="text-[length:var(--text-body-sm)] text-destructive" role="alert">No se pudo agregar a favoritos.</p>}
      {showMessage && getToken() && <MessageForm listingId={listingId} variant="inline" />}

      {purchase.confirmationOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="purchase-confirmation-title"
          className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-dropdown)]"
        >
          <p className="editorial-label">Compra Segura</p>
          <h2 id="purchase-confirmation-title" className="mt-1 text-lg font-semibold text-foreground">
            Confirmar compra
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">{listingTitle}</p>
          <dl className="mt-4 space-y-2 border-y border-border py-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Vinilo</dt>
              <dd className="font-medium text-foreground">{formatPriceCLP(priceClp)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Cargo Compra Segura</dt>
              <dd className="font-medium text-foreground">{formatPriceCLP(DEFAULT_PLATFORM_FEE_CLP)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-semibold text-foreground">Total</dt>
              <dd className="font-semibold text-foreground">{formatPriceCLP(priceClp + DEFAULT_PLATFORM_FEE_CLP)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Al continuar se creará un pedido, el vinilo quedará reservado para esta transacción y seguirás al flujo de compra.
          </p>
          {purchase.status === "error" && (
            <p className="mt-3 text-sm text-destructive" role="alert">{purchase.error}</p>
          )}
          <div className="mt-5 flex flex-wrap-reverse justify-end gap-3">
            <button
              type="button"
              onClick={() => dispatchPurchase({ type: "cancel" })}
              disabled={purchase.status === "loading"}
              className="btn-ghost py-2.5 text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handlePurchaseConfirm}
              disabled={purchase.status === "loading"}
              className="btn-primary py-2.5 text-sm"
            >
              {purchase.status === "loading" ? "Confirmando…" : "Confirmar compra"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
