"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { getListing, getStoredUser, getToken, updateListing } from "@/lib/api";
import { handleAuthRedirect, redirectToLogin } from "@/lib/auth-session";
import { isOwnListing } from "@/lib/auth";
import { DISCOGS_GRADES } from "@/lib/listing-grading";
import type { Listing, ListingUpdate } from "@/types";

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
  cover_image_url: "",
  price_clp: "",
  description: "",
  city: "",
};

type FormState = typeof emptyForm;
type FieldErrors = Partial<Record<keyof FormState, string>>;

function formFromListing(listing: Listing): FormState {
  return {
    title: listing.title ?? "",
    artist: listing.artist ?? "",
    label: listing.label ?? "",
    genre: listing.genre ?? "",
    subgenre: listing.subgenre ?? "",
    year: listing.year != null ? String(listing.year) : "",
    listing_type: listing.listing_type ?? "new",
    record_condition: listing.record_condition ?? "",
    cover_condition: listing.cover_condition ?? "",
    video_url: listing.video_url ?? "",
    cover_image_url: listing.cover_image_url ?? "",
    price_clp: listing.price_clp != null ? String(listing.price_clp) : "",
    description: listing.description ?? "",
    city: listing.city ?? "",
  };
}

function buildPayload(form: FormState): ListingUpdate {
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
    cover_image_url: form.cover_image_url.trim() || undefined,
    description: form.description.trim() || undefined,
  };
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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
  if (form.cover_image_url.trim() && !isValidHttpUrl(form.cover_image_url.trim())) {
    errors.cover_image_url = "Ingresa una URL http o https válida";
  }
  return errors;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

export default function EditListingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const listingId = Number(params.id);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      redirectToLogin(router, pathname);
      return;
    }

    if (Number.isNaN(listingId)) {
      setBlocked("Publicación no válida.");
      setLoading(false);
      return;
    }

    async function init() {
      try {
        const listing = await getListing(listingId);
        const currentUser = getStoredUser();
        if (!isOwnListing(listing, currentUser)) {
          setBlocked("Solo el vendedor puede editar esta publicación.");
          return;
        }
        if ((listing.status ?? "").toLowerCase() === "sold") {
          setBlocked("Las publicaciones vendidas no se pueden editar.");
          return;
        }
        setForm(formFromListing(listing));
      } catch (err) {
        if (handleAuthRedirect(err, router, pathname)) return;
        setBlocked("No se pudo cargar esta publicación.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [listingId, pathname, router]);

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

    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      await updateListing(listingId, buildPayload(form));
      setSuccess(true);
      setTimeout(() => {
        router.push(`/listings/${listingId}`);
      }, 1000);
    } catch (err) {
      if (handleAuthRedirect(err, router, pathname)) return;
      setSubmitError(
        err instanceof Error ? err.message : "No se pudo guardar los cambios. Intenta de nuevo.",
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-muted-foreground">
        Cargando publicación…
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {blocked}
        </p>
        <Link
          href={`/listings/${listingId}`}
          className="mt-4 inline-block text-sm font-medium text-muted-foreground hover:text-accent"
        >
          ← Volver a la publicación
        </Link>
      </div>
    );
  }

  const fieldsDisabled = saving || success;

  return (
    <div
      data-testid="edit-listing-page"
      className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10"
    >
      <Link
        href={`/listings/${listingId}`}
        className="text-sm font-medium text-muted-foreground transition hover:text-accent"
      >
        ← Volver a la publicación
      </Link>

      <header className="mt-4">
        <p className="editorial-label text-accent">Vendedores Melómanos</p>
        <h1
          data-testid="edit-listing-title"
          className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          Editar publicación
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Actualiza los datos de tu vinilo publicado.
        </p>
      </header>

      {success && (
        <div
          className="mt-6 rounded-2xl border border-success/30 bg-success/10 px-5 py-4"
          role="status"
        >
          <p className="font-semibold text-success">Cambios guardados.</p>
          <p className="mt-1 text-sm text-success/90">Redirigiendo a tu ficha…</p>
        </div>
      )}

      <form
        data-testid="edit-listing-form"
        onSubmit={handleSubmit}
        className={`mt-8 ${cardClass} space-y-8`}
      >
        <section>
          <h2 className={sectionTitleClass}>Datos del vinilo</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="title" className={labelClass}>
                Título del disco o single <span className="text-destructive">*</span>
              </label>
              <input
                id="title"
                data-testid="edit-title"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                disabled={fieldsDisabled}
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
                data-testid="edit-artist"
                value={form.artist}
                onChange={(e) => updateField("artist", e.target.value)}
                disabled={fieldsDisabled}
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
                data-testid="edit-label"
                value={form.label}
                onChange={(e) => updateField("label", e.target.value)}
                disabled={fieldsDisabled}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="genre" className={labelClass}>
                Género
              </label>
              <input
                id="genre"
                data-testid="edit-genre"
                value={form.genre}
                onChange={(e) => updateField("genre", e.target.value)}
                disabled={fieldsDisabled}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="subgenre" className={labelClass}>
                Subgénero
              </label>
              <input
                id="subgenre"
                data-testid="edit-subgenre"
                value={form.subgenre}
                onChange={(e) => updateField("subgenre", e.target.value)}
                disabled={fieldsDisabled}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="year" className={labelClass}>
                Año
              </label>
              <input
                id="year"
                data-testid="edit-year"
                type="number"
                min={1900}
                max={2100}
                value={form.year}
                onChange={(e) => updateField("year", e.target.value)}
                disabled={fieldsDisabled}
                className={`${inputClass} ${fieldErrors.year ? "border-destructive/50" : ""}`}
              />
              <FieldError message={fieldErrors.year} />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="cover_image_url" className={labelClass}>
                Imagen del disco
              </label>
              <input
                id="cover_image_url"
                data-testid="edit-cover-image-url"
                type="url"
                value={form.cover_image_url}
                onChange={(e) => updateField("cover_image_url", e.target.value)}
                disabled={fieldsDisabled}
                placeholder="https://…"
                className={`${inputClass} ${fieldErrors.cover_image_url ? "border-destructive/50" : ""}`}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Enlace a una imagen del disco (JPG, PNG)
              </p>
              {fieldErrors.cover_image_url && (
                <p data-testid="edit-cover-image-error" className="mt-1 text-xs text-destructive">
                  {fieldErrors.cover_image_url}
                </p>
              )}
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
                data-testid="edit-listing-type"
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
                data-testid="edit-record-condition"
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
                data-testid="edit-cover-condition"
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
                  data-testid="edit-video-url"
                  type="url"
                  value={form.video_url}
                  onChange={(e) => updateField("video_url", e.target.value)}
                  disabled={fieldsDisabled}
                  className={`${inputClass} ${fieldErrors.video_url ? "border-destructive/50" : ""}`}
                />
                {fieldErrors.video_url && (
                  <p data-testid="edit-video-error" className="mt-1 text-xs text-destructive">
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
                data-testid="edit-price"
                type="number"
                min={1}
                value={form.price_clp}
                onChange={(e) => updateField("price_clp", e.target.value)}
                disabled={fieldsDisabled}
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
                data-testid="edit-city"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                disabled={fieldsDisabled}
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
              data-testid="edit-description"
              rows={4}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              disabled={fieldsDisabled}
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
          data-testid="edit-submit"
          disabled={fieldsDisabled}
          className="btn-primary w-full py-3.5 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-10"
        >
          {saving ? "Guardando…" : success ? "Guardado" : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
