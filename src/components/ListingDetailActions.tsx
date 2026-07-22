"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MessageForm from "@/components/MessageForm";
import { IconHeart } from "@/components/icons";
import { isOwnListing } from "@/lib/auth";
import { addFavorite, getStoredUser, getToken, reserveListing } from "@/lib/api";

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
  const [reserveState, setReserveState] = useState<ActionState>("idle");
  const [reserveError, setReserveError] = useState("");

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

  async function handleReserve() {
    if (!requireAuth() || isReserved || isSold) return;
    setReserveState("loading");
    setReserveError("");
    try {
      await reserveListing(listingId);
      setReserveState("done");
    } catch (err) {
      setReserveState("error");
      setReserveError(err instanceof Error ? err.message : "No se pudo reservar el vinilo");
    }
  }

  if (isOwner) {
    return (
      <div className="px-1 py-1">
        <p className="badge-gold w-fit">Tu publicación</p>
        <p className="mt-3 text-lg font-semibold text-foreground">Esta es tu publicación</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Gestiona pedidos desde Compras y ventas cuando un comprador reserve este vinilo.
        </p>
        <Link href="/orders" className="mt-4 inline-flex text-sm font-semibold text-accent transition-ui hover:text-foreground">
          Ver pedidos →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
        <button
          type="button"
          onClick={handleReserve}
          disabled={reserveState === "loading" || reserveState === "done" || isReserved || isSold}
          className="btn-primary order-1 py-2.5 text-sm font-semibold uppercase tracking-wide disabled:opacity-50 sm:order-3"
        >
          {isSold ? "Vendido" : isReserved || reserveState === "done" ? "Reservado" : reserveState === "loading" ? "…" : "Reservar"}
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
      {reserveState === "done" && <p className="text-[length:var(--text-body-sm)] text-success" role="status">Vinilo reservado para ti.</p>}
      {reserveState === "error" && <p className="text-[length:var(--text-body-sm)] text-destructive" role="alert">{reserveError}</p>}

      {showMessage && getToken() && <MessageForm listingId={listingId} variant="inline" />}
    </div>
  );
}
