"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getMyShippingProfile, updateMyShippingProfile } from "@/lib/api";
import { handleAuthRedirect } from "@/lib/auth-session";
import { ALLOWED_COURIERS } from "@/lib/shipping-profile";
import type { SellerShippingProfile } from "@/types";

const inputClass = "input-field";

const labelClass = "block text-sm font-medium text-foreground";

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
      className="mt-8 card-surface p-6 sm:p-8"
    >
      <p className="text-sm font-semibold text-foreground">Perfil de despacho</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Configura cómo envías tus vinilos para que los compradores sepan qué esperar.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Cargando perfil de despacho…</p>
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
            <legend className={labelClass}>Transportistas preferidos</legend>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {ALLOWED_COURIERS.map((courier) => {
                const checked = preferredCouriers.includes(courier);
                const testId = `shipping-profile-courier-${courier.replace(/\s+/g, "-")}`;
                return (
                  <li key={courier}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 transition hover:border-accent/40">
                      <input
                        type="checkbox"
                        data-testid={testId}
                        checked={checked}
                        onChange={() => toggleCourier(courier)}
                        disabled={saving}
                        className="h-4 w-4 rounded border-border text-accent focus:ring-accent/30"
                      />
                      <span className="text-sm text-foreground">{courier}</span>
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
              className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}

          {success && (
            <p
              data-testid="shipping-profile-success"
              className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
              role="status"
            >
              {success}
            </p>
          )}

          <button
            type="submit"
            data-testid="shipping-profile-save"
            disabled={saving}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar perfil de despacho"}
          </button>
        </form>
      )}
    </section>
  );
}
