"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MessageForm from "@/components/MessageForm";
import { IconHeart } from "@/components/icons";
import { isOwnListing } from "@/lib/auth";
import { addFavorite, createOrderFromListing, getStoredUser, getToken } from "@/lib/api";

interface ListingDetailActionsProps {
  listingId: number;
  status?: string;
  sellerId?: number;
}

type ActionState = "idle" | "loading" | "done" | "error";

export default function ListingDetailActions({
  listingId,
  status,
  sellerId,
}: ListingDetailActionsProps) {
  const router = useRouter();
  const currentUser = getStoredUser();
  const isOwner = isOwnListing({ seller_id: sellerId }, currentUser);

  const [showMessage, setShowMessage] = useState(false);
  const [favState, setFavState] = useState<ActionState>("idle");
  const [buyState, setBuyState] = useState<ActionState>("idle");
  const [buyError, setBuyError] = useState("");

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

  async function handleBuy() {
    if (!requireAuth()) return;
    if (isReserved || isSold) return;

    setBuyState("loading");
    setBuyError("");
    try {
      const order = await createOrderFromListing(listingId);
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setBuyState("error");
      setBuyError(
        err instanceof Error ? err.message : "No se pudo crear el pedido",
      );
    }
  }

  if (isOwner) {
    return (
      <div className="card-surface px-5 py-5">
        <p className="badge-gold w-fit">Tu publicación</p>
        <p className="mt-3 text-lg font-semibold text-foreground">Esta es tu publicación</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Gestiona pedidos desde Compras y ventas cuando un comprador inicie una compra.
        </p>
        <Link
          href="/orders"
          className="mt-4 inline-flex text-sm font-semibold text-accent transition-ui hover:text-foreground"
        >
          Ver pedidos →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={handleFavorite}
          disabled={favState === "loading" || favState === "done"}
          className="btn-ghost font-semibold uppercase tracking-wide disabled:opacity-60"
        >
          {favState === "done" ? (
            <span className="inline-flex items-center gap-1.5">
              <IconHeart className="h-4 w-4 fill-accent text-accent" aria-hidden />
              En favoritos
            </span>
          ) : favState === "loading" ? (
            "…"
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <IconHeart className="h-4 w-4" aria-hidden />
              Favorito
            </span>
          )}
        </button>

        <button
          type="button"
          data-testid="listing-message-toggle"
          onClick={() => {
            if (!requireAuth()) return;
            setShowMessage((v) => !v);
          }}
          className="btn-ghost font-semibold uppercase tracking-wide"
        >
          Mensaje
        </button>

        <button
          type="button"
          onClick={handleBuy}
          disabled={buyState === "loading" || isReserved || isSold}
          className="btn-primary font-semibold uppercase tracking-wide disabled:opacity-50"
        >
          {isSold
            ? "Vendido"
            : isReserved
              ? "Reservado"
              : buyState === "loading"
                ? "…"
                : "Comprar"}
        </button>
      </div>

      {favState === "error" && (
        <p className="text-[length:var(--text-body-sm)] text-destructive">No se pudo agregar a favoritos.</p>
      )}
      {buyState === "error" && (
        <p className="text-[length:var(--text-body-sm)] text-destructive">{buyError}</p>
      )}

      {showMessage && getToken() && (
        <MessageForm listingId={listingId} variant="inline" />
      )}

      {showMessage && !getToken() && (
        <p className="card-surface border-dashed px-4 py-3 text-sm text-muted-foreground">
          <Link href="/login" className="font-semibold text-accent hover:text-foreground">
            Inicia sesión
          </Link>{" "}
          para enviar un mensaje al vendedor.
        </p>
      )}
    </div>
  );
}
