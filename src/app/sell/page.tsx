"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import SubscriptionCard from "@/components/SubscriptionCard";
import VinylCover from "@/components/VinylCover";
import { createListing, getMySubscription, getToken } from "@/lib/api";
import { handleAuthRedirect, redirectToLogin } from "@/lib/auth-session";
import { DISCOGS_GRADES } from "@/lib/listing-grading";
import { isListingLimitReached } from "@/lib/subscription";
import type { ListingCreate, SubscriptionStatus } from "@/types";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-60";

const labelClass =
  "block font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-400";

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
  if (!form.title.trim()) errors.title = "Title is required";
  if (!form.artist.trim()) errors.artist = "Artist is required";
  if (!form.city.trim()) errors.city = "City is required";
  if (!form.price_clp.trim()) {
    errors.price_clp = "Price is required";
  } else if (Number.isNaN(Number(form.price_clp)) || Number(form.price_clp) <= 0) {
    errors.price_clp = "Enter a valid price in CLP";
  }
  if (form.year.trim() && Number.isNaN(Number(form.year))) {
    errors.year = "Enter a valid year";
  }
  if (form.listing_type === "used" && !form.video_url.trim()) {
    errors.video_url = "Video URL is required for used listings";
  }
  if (form.video_url.trim()) {
    try {
      new URL(form.video_url.trim());
    } catch {
      errors.video_url = "Enter a valid video URL";
    }
  }
  return errors;
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
        err instanceof Error ? err.message : "Could not create listing. Try again.",
      );
      setLoading(false);
    }
  }

  if (!authChecked) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-zinc-500">
        Checking session…
      </div>
    );
  }

  const previewTitle = form.title.trim() || "Your release";
  const previewArtist = form.artist.trim() || "Artist";
  const atListingLimit = subscription ? isListingLimitReached(subscription) : false;
  const fieldsDisabled = loading || success;
  const submitDisabled = fieldsDisabled || atListingLimit;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="font-mono text-xs uppercase tracking-wider text-violet-300 hover:text-violet-200"
      >
        ← Back to marketplace
      </Link>

      <div className="mt-6 lg:grid lg:grid-cols-[minmax(260px,380px)_1fr] lg:gap-12">
        <div className="mx-auto w-full max-w-sm lg:max-w-none">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/90">
            List your press
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">+ Sell Vinyl</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Add a record to the crate. Collectors and DJs browse by genre, city,
            and condition.
          </p>

          <div className="mt-8">
            <VinylCover title={previewTitle} artist={previewArtist} size="hero" />
            <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Live preview
            </p>
          </div>
        </div>

        <div className="mt-10 lg:mt-0">
          {subscription && (
            <SubscriptionCard subscription={subscription} variant="sell" />
          )}

          {success && createdId !== null && (
            <div
              className="mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-4"
              role="status"
            >
              <p className="font-semibold text-emerald-200">Listing published.</p>
              <p className="mt-1 text-sm text-emerald-200/80">
                Redirecting to your vinyl detail page…
              </p>
              <Link
                href={`/listings/${createdId}`}
                className="mt-3 inline-block text-sm font-medium text-violet-300 hover:text-violet-200"
              >
                View listing now →
              </Link>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-xl shadow-violet-950/20 sm:p-8"
          >
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-violet-200">
              Release details
            </h2>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="title" className={labelClass}>
                  Title <span className="text-fuchsia-400">*</span>
                </label>
                <input
                  id="title"
                  data-testid="sell-title"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  disabled={fieldsDisabled}
                  placeholder="Album or single title"
                  className={`${inputClass} ${fieldErrors.title ? "border-red-500/50" : ""}`}
                />
                {fieldErrors.title && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.title}</p>
                )}
              </div>

              <div>
                <label htmlFor="artist" className={labelClass}>
                  Artist <span className="text-fuchsia-400">*</span>
                </label>
                <input
                  id="artist"
                  data-testid="sell-artist"
                  value={form.artist}
                  onChange={(e) => updateField("artist", e.target.value)}
                  disabled={fieldsDisabled}
                  placeholder="Artist or act"
                  className={`${inputClass} ${fieldErrors.artist ? "border-red-500/50" : ""}`}
                />
                {fieldErrors.artist && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.artist}</p>
                )}
              </div>

              <div>
                <label htmlFor="label" className={labelClass}>
                  Label
                </label>
                <input
                  id="label"
                  data-testid="sell-label"
                  value={form.label}
                  onChange={(e) => updateField("label", e.target.value)}
                  disabled={fieldsDisabled}
                  placeholder="Record label"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="genre" className={labelClass}>
                  Genre
                </label>
                <input
                  id="genre"
                  data-testid="sell-genre"
                  value={form.genre}
                  onChange={(e) => updateField("genre", e.target.value)}
                  disabled={fieldsDisabled}
                  placeholder="Techno, House, Jazz…"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="subgenre" className={labelClass}>
                  Subgenre
                </label>
                <input
                  id="subgenre"
                  data-testid="sell-subgenre"
                  value={form.subgenre}
                  onChange={(e) => updateField("subgenre", e.target.value)}
                  disabled={fieldsDisabled}
                  placeholder="Minimal, Deep…"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="year" className={labelClass}>
                  Year
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
                  className={`${inputClass} ${fieldErrors.year ? "border-red-500/50" : ""}`}
                />
                {fieldErrors.year && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.year}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-violet-200">
                  Grading Discogs & tipo
                </h3>
              </div>

              <div>
                <label htmlFor="listing_type" className={labelClass}>
                  Listing type
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
                  Record condition
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
                  Cover condition
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
                    Video URL <span className="text-fuchsia-400">*</span>
                  </label>
                  <input
                    id="video_url"
                    data-testid="sell-video-url"
                    type="url"
                    value={form.video_url}
                    onChange={(e) => updateField("video_url", e.target.value)}
                    disabled={fieldsDisabled}
                    placeholder="https://youtube.com/watch?v=…"
                    className={`${inputClass} ${fieldErrors.video_url ? "border-red-500/50" : ""}`}
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Obligatorio para vinilos usados. Muestra el disco en reproducción.
                  </p>
                  {fieldErrors.video_url && (
                    <p data-testid="sell-video-error" className="mt-1 text-xs text-red-400">
                      {fieldErrors.video_url}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="price_clp" className={labelClass}>
                  Price (CLP) <span className="text-fuchsia-400">*</span>
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
                  className={`${inputClass} ${fieldErrors.price_clp ? "border-red-500/50" : ""}`}
                />
                {fieldErrors.price_clp && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.price_clp}</p>
                )}
              </div>

              <div>
                <label htmlFor="city" className={labelClass}>
                  City <span className="text-fuchsia-400">*</span>
                </label>
                <input
                  id="city"
                  data-testid="sell-city"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  disabled={fieldsDisabled}
                  placeholder="Santiago"
                  className={`${inputClass} ${fieldErrors.city ? "border-red-500/50" : ""}`}
                />
                {fieldErrors.city && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.city}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="description" className={labelClass}>
                  Collector notes
                </label>
                <textarea
                  id="description"
                  data-testid="sell-description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  disabled={fieldsDisabled}
                  placeholder="Pressing details, listening notes, shipping…"
                  className={inputClass}
                />
              </div>
            </div>

            {submitError && (
              <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              data-testid="sell-submit"
              disabled={submitDisabled}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-60 sm:w-auto sm:px-10"
            >
              {loading ? "Publishing…" : success ? "Published" : "Publish to crate"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
