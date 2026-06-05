"use client";

import { useState } from "react";
import {
  ADMIN_UNAUTHORIZED_MESSAGE,
  getAdminDisputes,
  getAdminOrders,
  getAdminSummary,
  getAdminUsers,
} from "@/lib/api";
import { displayValue, formatMessageTime, formatPriceCLP } from "@/lib/format";
import type {
  AdminDispute,
  AdminOrder,
  AdminSummary,
  AdminUser,
} from "@/types";

const SUMMARY_CARDS: { key: keyof AdminSummary; label: string }[] = [
  { key: "users_count", label: "Users" },
  { key: "active_listings_count", label: "Active listings" },
  { key: "sold_listings_count", label: "Sold listings" },
  { key: "orders_count", label: "Orders" },
  { key: "disputed_orders_count", label: "Disputed orders" },
  { key: "open_disputes_count", label: "Open disputes" },
  { key: "under_review_disputes_count", label: "Under review" },
  { key: "completed_orders_count", label: "Completed orders" },
  { key: "refunded_orders_count", label: "Refunded orders" },
];

function AdminTable({
  headers,
  rows,
  emptyMessage,
}: {
  headers: string[];
  rows: (string | number)[][];
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-center text-sm text-zinc-400">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-violet-950/40">
            {headers.map((header) => (
              <th
                key={header}
                className="whitespace-nowrap px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-violet-200/90"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-white/5 transition hover:bg-violet-950/20"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="whitespace-nowrap px-3 py-2.5 text-zinc-200"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [usersTotal, setUsersTotal] = useState(0);

  async function handleLoadData() {
    const key = adminKey.trim();
    if (!key) {
      setError("Ingresa la clave admin.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [summaryData, disputesData, ordersData, usersData] =
        await Promise.all([
          getAdminSummary(key),
          getAdminDisputes(key),
          getAdminOrders(key, { skip: 0, limit: 50 }),
          getAdminUsers(key, { skip: 0, limit: 50 }),
        ]);

      setSummary(summaryData);
      setDisputes(disputesData);
      setOrders(ordersData.items);
      setOrdersTotal(ordersData.total);
      setUsers(usersData.items);
      setUsersTotal(usersData.total);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo cargar el panel admin.";
      setError(
        message === ADMIN_UNAUTHORIZED_MESSAGE
          ? ADMIN_UNAUTHORIZED_MESSAGE
          : message,
      );
      setSummary(null);
      setDisputes([]);
      setOrders([]);
      setUsers([]);
      setOrdersTotal(0);
      setUsersTotal(0);
    } finally {
      setLoading(false);
    }
  }

  const disputeRows = disputes.map((row) => [
    row.dispute_id,
    row.order_id,
    row.status,
    row.reason.length > 48 ? `${row.reason.slice(0, 48)}…` : row.reason,
    row.opened_by_user_id,
    row.order_status,
    row.payment_status,
    row.buyer_id,
    row.seller_id,
    formatMessageTime(row.created_at) || displayValue(row.created_at),
  ]);

  const orderRows = orders.map((row) => [
    row.order_id,
    row.listing_id,
    row.buyer_id,
    row.seller_id,
    row.status,
    row.payment_status,
    formatPriceCLP(row.platform_fee_clp),
    row.seller_amount_clp != null
      ? formatPriceCLP(row.seller_amount_clp)
      : "—",
    formatMessageTime(row.created_at) || displayValue(row.created_at),
  ]);

  const userRows = users.map((row) => [
    row.id,
    row.name,
    row.email,
    displayValue(row.city),
    row.plan_type,
    row.is_active ? "Yes" : "No",
    formatMessageTime(row.created_at) || displayValue(row.created_at),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fuchsia-400/80">
          Melómanos Ops
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
          Admin Panel
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Read-only MVP for operators. Enter the admin key to load marketplace
          data. The key is kept in this page only.
        </p>
      </div>

      <section className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/50 to-fuchsia-950/30 p-5 shadow-lg shadow-violet-950/30 sm:p-6">
        <label
          htmlFor="admin-key-input"
          className="block text-sm font-medium text-violet-100"
        >
          Admin key
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            id="admin-key-input"
            data-testid="admin-key-input"
            type="password"
            autoComplete="off"
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            placeholder="x-admin-key"
            className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm text-white outline-none ring-violet-500/40 placeholder:text-zinc-500 focus:border-violet-400/60 focus:ring-2 sm:max-w-md"
          />
          <button
            type="button"
            data-testid="admin-load-data"
            onClick={() => void handleLoadData()}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-950/50 transition hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Loading…" : "Load admin data"}
          </button>
        </div>
        {error && (
          <p
            data-testid="admin-error"
            className="mt-4 rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </p>
        )}
      </section>

      {summary && (
        <section
          data-testid="admin-summary-section"
          className="mt-8"
        >
          <h2 className="text-lg font-semibold text-white">Summary</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SUMMARY_CARDS.map(({ key, label }) => (
              <div
                key={key}
                data-testid={`admin-summary-${key}`}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-bold text-violet-100">
                  {summary[key]}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {summary && (
        <section
          data-testid="admin-disputes-section"
          className="mt-10"
        >
          <h2 className="text-lg font-semibold text-white">Disputes</h2>
          <div className="mt-4">
            <AdminTable
              headers={[
                "Dispute ID",
                "Order ID",
                "Status",
                "Reason",
                "Opened by",
                "Order status",
                "Payment status",
                "Buyer ID",
                "Seller ID",
                "Created",
              ]}
              rows={disputeRows}
              emptyMessage="No disputes loaded."
            />
          </div>
        </section>
      )}

      {summary && (
        <section
          data-testid="admin-orders-section"
          className="mt-10"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Orders</h2>
            <p className="text-xs text-zinc-500">
              Showing {orders.length} of {ordersTotal}
            </p>
          </div>
          <div className="mt-4">
            <AdminTable
              headers={[
                "Order ID",
                "Listing ID",
                "Buyer ID",
                "Seller ID",
                "Status",
                "Payment",
                "Platform fee",
                "Seller amount",
                "Created",
              ]}
              rows={orderRows}
              emptyMessage="No orders loaded."
            />
          </div>
        </section>
      )}

      {summary && (
        <section
          data-testid="admin-users-section"
          className="mt-10 pb-8"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Users</h2>
            <p className="text-xs text-zinc-500">
              Showing {users.length} of {usersTotal}
            </p>
          </div>
          <div className="mt-4">
            <AdminTable
              headers={[
                "ID",
                "Name",
                "Email",
                "City",
                "Plan",
                "Active",
                "Created",
              ]}
              rows={userRows}
              emptyMessage="No users loaded."
            />
          </div>
        </section>
      )}
    </div>
  );
}
