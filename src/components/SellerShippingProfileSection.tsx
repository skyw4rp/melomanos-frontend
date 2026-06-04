"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getMyShippingProfile, updateMyShippingProfile } from "@/lib/api";
import { handleAuthRedirect } from "@/lib/auth-session";
import { ALLOWED_COURIERS } from "@/lib/shipping-profile";
import type { SellerShippingProfile } from "@/types";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-60";

const labelClass =
  "block font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-400";

function profileToFormState(profile: SellerShippingProfile) {
  return {
    originCity: profile.origin_city ?? "",
    dispatchHours:
      profile.dispatch_time_hours != null
        ? String(profile.dispatch_time_hours)
        : "",
    preferredCouriers: [...(profile.preferred_couriers ?? [])],
    shippingNotes: profile.shipping_notes ?? "",
  };
}

export default function SellerShippingProfileSection() {
  const router = useRouter();
  const pathname = usePathname();
  const [originCity, setOriginCity] = useState("");
  const [dispatchHours, setDispatchHours] = useState("");
  const [preferredCouriers, setPreferredCouriers] = useState<string[]>([]);
  const [shippingNotes, setShippingNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const profile = await getMyShippingProfile();
      const form = profileToFormState(profile);
      setOriginCity(form.originCity);
      setDispatchHours(form.dispatchHours);
      setPreferredCouriers(form.preferredCouriers);
      setShippingNotes(form.shippingNotes);
    } catch (err) {
      if (handleAuthRedirect(err, router, pathname)) return;
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el perfil de despacho.",
      );
    } finally {
      setLoading(false);
    }
  }, [router, pathname]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function toggleCourier(name: string) {
    setPreferredCouriers((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
    setSuccess("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const hours = dispatchHours.trim() ? Number(dispatchHours) : null;
    if (dispatchHours.trim() && (hours == null || Number.isNaN(hours) || hours <= 0)) {
      setError("Ingresa un tiempo de despacho válido en horas.");
      setSaving(false);
      return;
    }

    try {
      await updateMyShippingProfile({
        origin_city: originCity.trim() || null,
        dispatch_time_hours: hours,
        preferred_couriers: preferredCouriers,
        shipping_notes: shippingNotes.trim() || null,
      });
      setSuccess("Perfil de despacho actualizado.");
    } catch (err) {
      if (handleAuthRedirect(err, router, pathname)) return;
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el perfil de despacho.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      data-testid="shipping-profile-section"
      className="mt-8 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/50 via-[#120a1f] to-fuchsia-950/20 p-6 sm:p-8"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/90">
        Perfil de despacho
      </p>
      <p className="mt-2 text-sm text-zinc-400">
        Configura cómo envías tus vinilos para que los compradores sepan qué esperar.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-zinc-500">Cargando perfil de despacho…</p>
      ) : (
        <form
          data-testid="shipping-profile-form"
          onSubmit={handleSubmit}
          className="mt-6 space-y-5"
        >
          <label className={labelClass}>
            Ciudad origen
            <input
              data-testid="shipping-profile-origin-city"
              type="text"
              value={originCity}
              onChange={(e) => {
                setOriginCity(e.target.value);
                setSuccess("");
              }}
              disabled={saving}
              placeholder="Santiago"
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Tiempo despacho en horas
            <input
              data-testid="shipping-profile-dispatch-hours"
              type="number"
              min={1}
              value={dispatchHours}
              onChange={(e) => {
                setDispatchHours(e.target.value);
                setSuccess("");
              }}
              disabled={saving}
              placeholder="24"
              className={inputClass}
            />
          </label>

          <fieldset>
            <legend className={labelClass}>Couriers preferidos</legend>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {ALLOWED_COURIERS.map((courier) => {
                const checked = preferredCouriers.includes(courier);
                const testId = `shipping-profile-courier-${courier.replace(/\s+/g, "-")}`;
                return (
                  <li key={courier}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 transition hover:border-violet-400/40">
                      <input
                        type="checkbox"
                        data-testid={testId}
                        checked={checked}
                        onChange={() => toggleCourier(courier)}
                        disabled={saving}
                        className="h-4 w-4 rounded border-white/20 bg-black/40 text-violet-500 focus:ring-violet-500/40"
                      />
                      <span className="text-sm text-zinc-200">{courier}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          <label className={labelClass}>
            Notas de despacho
            <textarea
              data-testid="shipping-profile-notes"
              value={shippingNotes}
              onChange={(e) => {
                setShippingNotes(e.target.value);
                setSuccess("");
              }}
              rows={3}
              disabled={saving}
              placeholder="Horarios, embalaje, retiros…"
              className={`${inputClass} resize-y`}
            />
          </label>

          {error && (
            <p
              data-testid="shipping-profile-error"
              className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              role="alert"
            >
              {error}
            </p>
          )}

          {success && (
            <p
              data-testid="shipping-profile-success"
              className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
              role="status"
            >
              {success}
            </p>
          )}

          <button
            type="submit"
            data-testid="shipping-profile-save"
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar perfil de despacho"}
          </button>
        </form>
      )}
    </section>
  );
}
