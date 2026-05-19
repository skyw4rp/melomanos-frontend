"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MessageForm from "@/components/MessageForm";
import { isOwnListing } from "@/lib/auth";
import { addFavorite, getStoredUser, getToken, reserveListing } from "@/lib/api";

interface ListingDetailActionsProps {
  listingId: number;
  status: string;
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

  const isReserved = status.toLowerCase() === "reserved";
  const isSold = status.toLowerCase() === "sold";

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
    if (!requireAuth()) return;
    if (isReserved || isSold) return;

    setReserveState("loading");
    setReserveError("");
    try {
      await reserveListing(listingId);
      setReserveState("done");
    } catch (err) {
      setReserveState("error");
      setReserveError(
        err instanceof Error ? err.message : "No se pudo reservar este vinilo",
      );
    }
  }

  if (isOwner) {
    return (
      <div className="rounded-2xl border border-fuchsia-500/25 bg-gradient-to-br from-violet-950/40 to-[#0d0a14] px-5 py-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fuchsia-300/90">
          Tu publicación
        </p>
        <p className="mt-2 text-lg font-semibold text-white">Esta es tu publicación</p>
        <p className="mt-2 text-sm text-zinc-400">
          Puedes gestionarla desde tu perfil próximamente.
        </p>
        <Link
          href="/profile"
          className="mt-4 inline-block text-sm font-medium text-violet-300 hover:text-violet-200"
        >
          Ir a tu perfil →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={handleFavorite}
          disabled={favState === "loading" || favState === "done"}
          className="rounded-xl border border-violet-400/35 bg-violet-950/40 px-4 py-3 text-xs font-bold uppercase tracking-wide text-violet-200 transition hover:border-fuchsia-400/50 hover:bg-violet-900/50 hover:text-white disabled:opacity-60"
        >
          {favState === "done"
            ? "En favoritos"
            : favState === "loading"
              ? "…"
              : "Favorito"}
        </button>

        <button
          type="button"
          onClick={() => {
            if (!requireAuth()) return;
            setShowMessage((v) => !v);
          }}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-200 transition hover:border-violet-400/40 hover:bg-white/10 hover:text-white"
        >
          Mensaje
        </button>

        <button
          type="button"
          onClick={handleReserve}
          disabled={
            reserveState === "loading" ||
            reserveState === "done" ||
            isReserved ||
            isSold
          }
          className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-violet-950/40 transition hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50"
        >
          {reserveState === "done"
            ? "Reservado"
            : isReserved
              ? "Ya reservado"
              : isSold
                ? "Vendido"
                : reserveState === "loading"
                  ? "…"
                  : "Reservar vinilo"}
        </button>
      </div>

      {favState === "error" && (
        <p className="text-xs text-red-400">No se pudo agregar a favoritos.</p>
      )}
      {reserveState === "error" && (
        <p className="text-xs text-red-400">{reserveError}</p>
      )}

      {showMessage && getToken() && (
        <MessageForm listingId={listingId} variant="inline" />
      )}

      {showMessage && !getToken() && (
        <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-sm text-zinc-400">
          <Link href="/login" className="font-medium text-violet-300 hover:text-violet-200">
            Inicia sesión
          </Link>{" "}
          para enviar un mensaje al vendedor.
        </p>
      )}
    </div>
  );
}
