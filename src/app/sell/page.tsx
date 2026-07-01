"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import SubscriptionCard from "@/components/SubscriptionCard";
import VinylCover from "@/components/VinylCover";
import { createListing, getMySubscription, getToken } from "@/lib/api";
import { handleAuthRedirect, redirectToLogin } from "@/lib/auth-session";
import { formatPriceCLP } from "@/lib/format";
import { DISCOGS_GRADES } from "@/lib/listing-grading";
import { isListingLimitReached } from "@/lib/subscription";
import type { ListingCreate, SubscriptionStatus } from "@/types";

const cardClass = "card-surface p-5 sm:p-6";

const inputClass = "input-field";

const labelClass = "label-field";

const sectionTitleClass =
  "text-sm font-semibold text-foreground border-b border-border pb-2";

const emptyForm = {
  title: "",
  artist: "",
  label: "",
  genre: "",
  subgenre: "",
  year: "",
  listing_type: "new",
  record_condition: "",
  cover_condition: "",
  video_url: "",
  price_clp: "",
  description: "",
  city: "",
};

type FormState = typeof emptyForm;
type FieldErrors = Partial<Record<keyof FormState, string>>;

function buildPayload(form: FormState): ListingCreate {
  const year = form.year.trim() ? Number(form.year) : undefined;
  return {
    title: form.title.trim(),
    artist: form.artist.trim(),
    city: form.city.trim(),
    price_clp: Number(form.price_clp),
    label: form.label.trim() || undefined,
    genre: form.genre.trim() || undefined,
    subgenre: form.subgenre.trim() || undefined,
    year: year && !Number.isNaN(year) ? year : undefined,
    listing_type: form.listing_type.trim() || undefined,
    record_condition: form.record_condition.trim() || undefined,
    cover_condition: form.cover_condition.trim() || undefined,
    video_url:
      form.listing_type === "used"
        ? form.video_url.trim() || undefined
        : form.video_url.trim() || null,
    description: form.description.trim() || undefined,
  };
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.title.trim()) errors.title = "El título es obligatorio";
  if (!form.artist.trim()) errors.artist = "El artista es obligatorio";
  if (!form.city.trim()) errors.city = "La ciudad es obligatoria";
  if (!form.price_clp.trim()) {
    errors.price_clp = "El precio es obligatorio";
  } else if (Number.isNaN(Number(form.price_clp)) || Number(form.price_clp) <= 0) {
    errors.price_clp = "Ingresa un precio válido en CLP";
  }
  if (form.year.trim() && Number.isNaN(Number(form.year))) {
    errors.year = "Ingresa un año válido";
  }
  if (form.listing_type === "used" && !form.video_url.trim()) {
    errors.video_url = "La URL de video es obligatoria para vinilos usados";
  }
  if (form.video_url.trim()) {
    try {
      new URL(form.video_url.trim());
    } catch {
      errors.video_url = "Ingresa una URL de video válida";
    }
  }
  return errors;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

export default function SellPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    if (!getToken()) {
      redirectToLogin(router, pathname);
      return;
    }

    async function init() {
      setAuthChecked(true);
      try {
        const sub = await getMySubscription();
        setSubscription(sub);
      } catch (err) {
        if (handleAuthRedirect(err, router, pathname)) return;
        setSubscription(null);
      }
    }

    init();
  }, [router, pathname]);

  function updateField(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError("");

    if (subscription && isListingLimitReached(subscription)) {
      return;
    }

    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const listing = await createListing(buildPayload(form));
      setCreatedId(listing.id);
      setSuccess(true);
      setTimeout(() => {
        router.push(`/listings/${listing.id}`);
      }, 1200);
    } catch (err) {
      if (handleAuthRedirect(err, router, pathname)) return;
      setSubmitError(
        err instanceof Error ? err.message : "No se pudo crear la publicación. Intenta de nuevo.",
      );
      setLoading(false);
    }
  }

  if (!authChecked) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-muted-foreground">
        Verificando sesión…
      </div>
    );
  }

  const previewTitle = form.title.trim() || "Tu publicación";
  const previewArtist = form.artist.trim() || "Artista";
  const previewCity = form.city.trim() || "Ciudad";
  const previewPrice = form.price_clp.trim()
    ? formatPriceCLP(Number(form.price_clp))
    : formatPriceCLP(0);
  const atListingLimit = subscription ? isListingLimitReached(subscription) : false;
  const fieldsDisabled = loading || success;
  const submitDisabled = fieldsDisabled || atListingLimit;

  return (
    <div
      data-testid="sell-page"
      className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10"
    >
      <Link
        href="/"
        data-testid="sell-back-link"
        className="text-sm font-medium text-muted-foreground transition hover:text-accent"
      >
        ← Volver al catálogo
      </Link>

      <header className="mt-4">
        <p className="editorial-label text-accent">Vendedores Melómanos</p>
        <h1
          data-testid="sell-page-title"
          className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          Publicar vinilo
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Crea una ficha clara para que coleccionistas y DJs puedan encontrar tu
          publicación.
        </p>
      </header>

      <aside
        data-testid="sell-trust-block"
        className="mt-6 rounded-2xl border border-border bg-surface-muted/40 px-5 py-4 shadow-[var(--shadow-card)] sm:px-6 sm:py-5"
      >
        <h2 className="text-sm font-semibold text-foreground">
          Publica con claridad
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Mientras más precisa sea la información del vinilo, más fácil será
          generar confianza con compradores y coleccionistas.
        </p>
      </aside>

      <div className="mt-8 lg:grid lg:grid-cols-[minmax(260px,340px)_1fr] lg:gap-10">
        <div className="mx-auto w-full max-w-sm lg:max-w-none">
          <article
            data-testid="sell-preview-card"
            className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]"
          >
            <VinylCover title={previewTitle} artist={previewArtist} size="card" />
            <div className="p-4 sm:p-5">
              <p className="truncate text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {previewArtist}
              </p>
              <h2 className="mt-1 line-clamp-2 text-base font-semibold leading-snug text-foreground">
                {previewTitle}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{previewCity}</p>
              <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">
                {previewPrice}
              </p>
            </div>
          </article>
          <p className="mt-3 text-center text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Vista previa
          </p>
        </div>

        <div className="mt-8 lg:mt-0">
          {subscription && (
            <div data-testid="sell-plan-card">
              <SubscriptionCard subscription={subscription} variant="sell" />
            </div>
          )}

          {success && createdId !== null && (
            <div
              className="mb-6 rounded-2xl border border-success/30 bg-success/10 px-5 py-4"
              role="status"
            >
              <p className="font-semibold text-success">Publicación creada.</p>
              <p className="mt-1 text-sm text-success/90">
                Redirigiendo a tu ficha…
              </p>
              <Link
                href={`/listings/${createdId}`}
                className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
              >
                Ver publicación ahora →
              </Link>
            </div>
          )}

          <form
            data-testid="sell-form"
            onSubmit={handleSubmit}
            className={`${cardClass} space-y-8`}
          >
            <section>
              <h2 className={sectionTitleClass}>Datos del vinilo</h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="title" className={labelClass}>
                    Título del disco o single{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="title"
                    data-testid="sell-title"
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    disabled={fieldsDisabled}
                    placeholder="Título del disco o single"
                    className={`${inputClass} ${fieldErrors.title ? "border-destructive/50" : ""}`}
                  />
                  <FieldError message={fieldErrors.title} />
                </div>

                <div>
                  <label htmlFor="artist" className={labelClass}>
                    Artista <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="artist"
                    data-testid="sell-artist"
                    value={form.artist}
                    onChange={(e) => updateField("artist", e.target.value)}
                    disabled={fieldsDisabled}
                    placeholder="Artista"
                    className={`${inputClass} ${fieldErrors.artist ? "border-destructive/50" : ""}`}
                  />
                  <FieldError message={fieldErrors.artist} />
                </div>

                <div>
                  <label htmlFor="label" className={labelClass}>
                    Sello
                  </label>
                  <input
                    id="label"
                    data-testid="sell-label"
                    value={form.label}
                    onChange={(e) => updateField("label", e.target.value)}
                    disabled={fieldsDisabled}
                    placeholder="Sello"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="genre" className={labelClass}>
                    Género
                  </label>
                  <input
                    id="genre"
                    data-testid="sell-genre"
                    value={form.genre}
                    onChange={(e) => updateField("genre", e.target.value)}
                    disabled={fieldsDisabled}
                    placeholder="House, Techno, Minimal…"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="subgenre" className={labelClass}>
                    Subgénero
                  </label>
                  <input
                    id="subgenre"
                    data-testid="sell-subgenre"
                    value={form.subgenre}
                    onChange={(e) => updateField("subgenre", e.target.value)}
                    disabled={fieldsDisabled}
                    placeholder="Minimal, Deep House…"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="year" className={labelClass}>
                    Año
                  </label>
                  <input
                    id="year"
                    data-testid="sell-year"
                    type="number"
                    min={1900}
                    max={2100}
                    value={form.year}
                    onChange={(e) => updateField("year", e.target.value)}
                    disabled={fieldsDisabled}
                    placeholder="1998"
                    className={`${inputClass} ${fieldErrors.year ? "border-destructive/50" : ""}`}
                  />
                  <FieldError message={fieldErrors.year} />
                </div>
              </div>
            </section>

            <section>
              <h2 className={sectionTitleClass}>Clasificación y estado</h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="listing_type" className={labelClass}>
                    Tipo de publicación
                  </label>
                  <select
                    id="listing_type"
                    data-testid="sell-listing-type"
                    value={form.listing_type}
                    onChange={(e) => updateField("listing_type", e.target.value)}
                    disabled={fieldsDisabled}
                    className={inputClass}
                  >
                    <option value="new">Nuevo (sellado)</option>
                    <option value="used">Usado</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="record_condition" className={labelClass}>
                    Estado del disco
                  </label>
                  <select
                    id="record_condition"
                    data-testid="sell-record-condition"
                    value={form.record_condition}
                    onChange={(e) => updateField("record_condition", e.target.value)}
                    disabled={fieldsDisabled}
                    className={inputClass}
                  >
                    <option value="">—</option>
                    {DISCOGS_GRADES.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="cover_condition" className={labelClass}>
                    Estado de la carátula
                  </label>
                  <select
                    id="cover_condition"
                    data-testid="sell-cover-condition"
                    value={form.cover_condition}
                    onChange={(e) => updateField("cover_condition", e.target.value)}
                    disabled={fieldsDisabled}
                    className={inputClass}
                  >
                    <option value="">—</option>
                    {DISCOGS_GRADES.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>

                {form.listing_type === "used" && (
                  <div className="sm:col-span-2">
                    <label htmlFor="video_url" className={labelClass}>
                      URL de video <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="video_url"
                      data-testid="sell-video-url"
                      type="url"
                      value={form.video_url}
                      onChange={(e) => updateField("video_url", e.target.value)}
                      disabled={fieldsDisabled}
                      placeholder="https://youtube.com/watch?v=…"
                      className={`${inputClass} ${fieldErrors.video_url ? "border-destructive/50" : ""}`}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Obligatorio para vinilos usados. Muestra el disco en reproducción.
                    </p>
                    {fieldErrors.video_url && (
                      <p data-testid="sell-video-error" className="mt-1 text-xs text-destructive">
                        {fieldErrors.video_url}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className={sectionTitleClass}>Precio y ubicación</h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="price_clp" className={labelClass}>
                    Precio (CLP) <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="price_clp"
                    data-testid="sell-price"
                    type="number"
                    min={1}
                    value={form.price_clp}
                    onChange={(e) => updateField("price_clp", e.target.value)}
                    disabled={fieldsDisabled}
                    placeholder="45000"
                    className={`${inputClass} ${fieldErrors.price_clp ? "border-destructive/50" : ""}`}
                  />
                  <FieldError message={fieldErrors.price_clp} />
                </div>

                <div>
                  <label htmlFor="city" className={labelClass}>
                    Ciudad <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="city"
                    data-testid="sell-city"
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    disabled={fieldsDisabled}
                    placeholder="Santiago"
                    className={`${inputClass} ${fieldErrors.city ? "border-destructive/50" : ""}`}
                  />
                  <FieldError message={fieldErrors.city} />
                </div>
              </div>
            </section>

            <section>
              <h2 className={sectionTitleClass}>Notas para compradores</h2>
              <div className="mt-5">
                <label htmlFor="description" className={labelClass}>
                  Notas para compradores
                </label>
                <textarea
                  id="description"
                  data-testid="sell-description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  disabled={fieldsDisabled}
                  placeholder="Prensado, estado de escucha, envío…"
                  className={`${inputClass} resize-y`}
                />
              </div>
            </section>

            {submitError && (
              <p
                className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                {submitError}
              </p>
            )}

            <button
              type="submit"
              data-testid="sell-submit"
              disabled={submitDisabled}
              className="btn-primary w-full py-3.5 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-10"
            >
              {loading ? "Publicando…" : success ? "Publicado" : "Publicar vinilo"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
