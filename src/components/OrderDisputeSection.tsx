"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  addDisputeEvidence,
  getDisputeEvidence,
  getOrderDispute,
  markDisputeUnderReview,
  openOrderDispute,
  resolveDisputeForBuyer,
  resolveDisputeForSeller,
} from "@/lib/api";
import { handleAuthRedirect } from "@/lib/auth-session";
import {
  canAddDisputeEvidence,
  canOpenOrderDispute,
  disputeOpenedByLabel,
  disputeStatusLabel,
  evidenceTypeFromSelect,
  evidenceTypeLabel,
  isResolvedDisputeStatus,
} from "@/lib/disputes";
import { formatMessageTime } from "@/lib/format";
import { isOrderBuyer, isOrderSeller, normalizeOrderStatus } from "@/lib/orders";
import type { DisputeEvidence, Order, OrderDispute, User } from "@/types";

const inputClass =
  "mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-60";

interface OrderDisputeSectionProps {
  order: Order;
  user: User;
  onOrderRefresh: () => Promise<void>;
  showOpenForm?: boolean;
  onOpenFormShown?: () => void;
}

export default function OrderDisputeSection({
  order,
  user,
  onOrderRefresh,
  showOpenForm = false,
  onOpenFormShown,
}: OrderDisputeSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isBuyer = isOrderBuyer(order, user.id);
  const isSeller = isOrderSeller(order, user.id);
  const status = normalizeOrderStatus(order.status);

  const [dispute, setDispute] = useState<OrderDispute | null>(null);
  const [evidence, setEvidence] = useState<DisputeEvidence[]>([]);
  const [loadingDispute, setLoadingDispute] = useState(true);
  const [openFormVisible, setOpenFormVisible] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceType, setEvidenceType] = useState("photo");
  const [evidenceComment, setEvidenceComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");

  const loadDisputeData = useCallback(async () => {
    setLoadingDispute(true);
    setError("");
    try {
      const disputeData = await getOrderDispute(order.id);
      setDispute(disputeData);
      if (disputeData) {
        const items = await getDisputeEvidence(disputeData.id);
        setEvidence(items);
      } else {
        setEvidence([]);
      }
    } catch (err) {
      if (handleAuthRedirect(err, router, pathname)) return;
      setDispute(null);
      setEvidence([]);
      setError(
        err instanceof Error ? err.message : "No se pudo cargar la disputa.",
      );
    } finally {
      setLoadingDispute(false);
    }
  }, [order.id, router, pathname]);

  useEffect(() => {
    if (!isBuyer && !isSeller) return;
    loadDisputeData();
  }, [isBuyer, isSeller, loadDisputeData]);

  useEffect(() => {
    if (showOpenForm) {
      setOpenFormVisible(true);
      onOpenFormShown?.();
    }
  }, [showOpenForm, onOpenFormShown]);

  if (!isBuyer && !isSeller) return null;

  const canOpen = !dispute && canOpenOrderDispute(status);

  async function handleOpenDispute(e: FormEvent) {
    e.preventDefault();
    const reason = disputeReason.trim();
    if (!reason) {
      setError("Describe el motivo de la disputa.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const opened = await openOrderDispute(order.id, reason);
      setDispute(opened);
      setDisputeReason("");
      setOpenFormVisible(false);
      await onOrderRefresh();
      const items = await getDisputeEvidence(opened.id);
      setEvidence(items);
    } catch (err) {
      if (handleAuthRedirect(err, router, pathname)) return;
      setError(
        err instanceof Error ? err.message : "No se pudo abrir la disputa.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleAddEvidence(e: FormEvent) {
    e.preventDefault();
    if (!dispute) return;

    const fileUrl = evidenceUrl.trim();
    if (!fileUrl) {
      setError("Ingresa la URL del archivo de evidencia.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await addDisputeEvidence(dispute.id, {
        file_url: fileUrl,
        evidence_type: evidenceTypeFromSelect(evidenceType),
        comment: evidenceComment.trim() || undefined,
      });
      setEvidenceUrl("");
      setEvidenceComment("");
      const items = await getDisputeEvidence(dispute.id);
      setEvidence(items);
    } catch (err) {
      if (handleAuthRedirect(err, router, pathname)) return;
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo agregar la evidencia.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleAdminAction(
    action: "under-review" | "resolve-buyer" | "resolve-seller",
  ) {
    if (!dispute) return;
    const key = adminKey.trim();
    if (!key) {
      setError("Ingresa la admin key.");
      return;
    }

    setBusy(true);
    setError("");
    setAdminSuccess("");

    try {
      const result =
        action === "under-review"
          ? await markDisputeUnderReview(dispute.id, key)
          : action === "resolve-buyer"
            ? await resolveDisputeForBuyer(dispute.id, key)
            : await resolveDisputeForSeller(dispute.id, key);

      setDispute(result.dispute);
      await onOrderRefresh();
      await loadDisputeData();

      const messages: Record<typeof action, string> = {
        "under-review": "Disputa marcada en revisión.",
        "resolve-buyer": "Disputa resuelta a favor del comprador.",
        "resolve-seller": "Disputa resuelta a favor del vendedor.",
      };
      setAdminSuccess(messages[action]);
    } catch (err) {
      if (handleAuthRedirect(err, router, pathname)) return;
      setError(
        err instanceof Error
          ? err.message
          : "No autorizado o acción inválida.",
      );
    } finally {
      setBusy(false);
    }
  }

  const disputeResolved = dispute
    ? isResolvedDisputeStatus(dispute.status)
    : false;
  const showEvidenceForm =
    dispute != null && canAddDisputeEvidence(dispute.status);

  return (
    <section
      data-testid="order-dispute-section"
      className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/25 via-violet-950/30 to-fuchsia-950/15 p-5 sm:p-6"
    >
      <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-red-200/90">
        Disputa
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-zinc-300">
        Si el vinilo llegó dañado, no coincide con la publicación o hubo un
        problema de envío, abre una disputa y agrega evidencia.
      </p>

      {loadingDispute ? (
        <p className="mt-4 text-sm text-zinc-500">Cargando disputa…</p>
      ) : dispute ? (
        <div
          data-testid="order-dispute-card"
          className="mt-5 rounded-xl border border-white/10 bg-black/25 p-4 sm:p-5"
        >
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
              <dt className="text-zinc-500">Estado disputa</dt>
              <dd
                data-testid="order-dispute-status"
                data-dispute-status={dispute.status}
                className="font-medium text-white"
              >
                {disputeStatusLabel(dispute.status)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Motivo</dt>
              <dd
                data-testid="order-dispute-reason-display"
                className="mt-1 text-zinc-200"
              >
                {dispute.reason}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
              <dt className="text-zinc-500">Abierta por</dt>
              <dd className="font-medium text-white">
                {disputeOpenedByLabel(dispute, order.buyer_id, order.seller_id)}
              </dd>
            </div>
            {dispute.created_at && (
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Fecha</dt>
                <dd className="font-mono text-xs text-zinc-300">
                  {formatMessageTime(dispute.created_at)}
                </dd>
              </div>
            )}
          </dl>

          {!disputeResolved && (
            <p
              data-testid="order-dispute-funds-held"
              className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90"
            >
              Los fondos permanecen retenidos mientras Melómanos revisa la
              disputa.
            </p>
          )}

          {showEvidenceForm && (
          <form onSubmit={handleAddEvidence} className="mt-6 space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-violet-300/90">
              Agregar evidencia
            </p>
            <label className="block text-xs text-zinc-500">
              URL del archivo *
              <input
                data-testid="order-dispute-evidence-url"
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                disabled={busy}
                placeholder="https://…"
                className={inputClass}
              />
            </label>
            <label className="block text-xs text-zinc-500">
              Tipo *
              <select
                data-testid="order-dispute-evidence-type"
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value)}
                disabled={busy}
                className={inputClass}
              >
                <option value="photo">Foto</option>
                <option value="video">Video</option>
              </select>
            </label>
            <label className="block text-xs text-zinc-500">
              Comentario (opcional)
              <textarea
                data-testid="order-dispute-evidence-comment"
                value={evidenceComment}
                onChange={(e) => setEvidenceComment(e.target.value)}
                rows={2}
                disabled={busy}
                className={`${inputClass} resize-y`}
              />
            </label>
            <button
              type="submit"
              data-testid="order-dispute-evidence-submit"
              disabled={busy}
              className="rounded-xl border border-violet-500/30 bg-violet-500/15 px-5 py-2.5 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/25 disabled:opacity-50"
            >
              {busy ? "Agregando…" : "Agregar evidencia"}
            </button>
          </form>
          )}

          {evidence.length > 0 && (
            <ul
              data-testid="order-dispute-evidence-list"
              className="mt-5 space-y-3"
            >
              {evidence.map((item) => (
                <li
                  key={item.id}
                  data-testid={`order-dispute-evidence-${item.id}`}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-sm"
                >
                  <p className="font-mono text-[10px] uppercase tracking-wide text-zinc-500">
                    {evidenceTypeLabel(item.evidence_type)}
                  </p>
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block break-all font-medium text-violet-300 hover:text-violet-200"
                  >
                    {item.file_url}
                  </a>
                  {item.comment?.trim() && (
                    <p className="mt-2 text-zinc-300">{item.comment}</p>
                  )}
                  {item.created_at && (
                    <p className="mt-1 font-mono text-[10px] text-zinc-600">
                      {formatMessageTime(item.created_at)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div
            data-testid="order-dispute-admin-section"
            className="mt-6 border-t border-white/10 pt-5"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-fuchsia-300/90">
              Admin resolución disputa
            </p>
            <label className="mt-3 block text-xs text-zinc-500">
              Admin key
              <input
                data-testid="order-dispute-admin-key"
                type="password"
                value={adminKey}
                onChange={(e) => {
                  setAdminKey(e.target.value);
                  setAdminSuccess("");
                }}
                disabled={busy}
                autoComplete="off"
                className={inputClass}
              />
            </label>

            {dispute.status === "open" && (
              <button
                type="button"
                data-testid="order-dispute-admin-under-review"
                onClick={() => handleAdminAction("under-review")}
                disabled={busy}
                className="mt-3 w-full rounded-xl border border-violet-500/30 bg-violet-500/15 px-4 py-2.5 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/25 disabled:opacity-50 sm:w-auto"
              >
                Marcar en revisión
              </button>
            )}

            {dispute.status === "under_review" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  data-testid="order-dispute-admin-resolve-buyer"
                  onClick={() => handleAdminAction("resolve-buyer")}
                  disabled={busy}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  Resolver a favor comprador
                </button>
                <button
                  type="button"
                  data-testid="order-dispute-admin-resolve-seller"
                  onClick={() => handleAdminAction("resolve-seller")}
                  disabled={busy}
                  className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/20 disabled:opacity-50"
                >
                  Resolver a favor vendedor
                </button>
              </div>
            )}

            {disputeResolved && (
              <p className="mt-3 text-sm text-zinc-400">
                Disputa cerrada — {disputeStatusLabel(dispute.status)}.
              </p>
            )}
          </div>
        </div>
      ) : canOpen ? (
        <div className="mt-5">
          {!openFormVisible ? (
            <button
              type="button"
              data-testid="order-dispute-open-toggle"
              onClick={() => setOpenFormVisible(true)}
              disabled={busy}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              Abrir disputa
            </button>
          ) : (
            <form onSubmit={handleOpenDispute} className="space-y-4">
              <label className="block text-xs text-zinc-500">
                Motivo *
                <textarea
                  data-testid="order-dispute-reason"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={4}
                  disabled={busy}
                  placeholder="Describe el problema con el vinilo o el envío…"
                  className={`${inputClass} resize-y`}
                />
              </label>
              <button
                type="submit"
                data-testid="order-dispute-submit"
                disabled={busy}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50"
              >
                {busy ? "Enviando…" : "Enviar disputa"}
              </button>
            </form>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-500">
          No hay disputa activa en este pedido.
        </p>
      )}

      {adminSuccess && (
        <p
          data-testid="order-dispute-admin-success"
          className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200"
          role="status"
        >
          {adminSuccess}
        </p>
      )}

      {error && (
        <p
          data-testid="order-dispute-error"
          className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
          role="alert"
        >
          {error}
        </p>
      )}
    </section>
  );
}
