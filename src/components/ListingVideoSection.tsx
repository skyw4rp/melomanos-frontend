import { youtubeEmbedUrl } from "@/lib/listing-grading";

interface ListingVideoSectionProps {
  videoUrl?: string | null;
}

export default function ListingVideoSection({ videoUrl }: ListingVideoSectionProps) {
  const url = videoUrl?.trim();
  if (!url) return null;

  const embed = youtubeEmbedUrl(url);

  return (
    <section className="card-surface mt-12 p-6 sm:p-8">
      <h2 className="editorial-eyebrow">Video del vinilo</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Revisión en video para compradores de vinilo usado.
      </p>

      {embed ? (
        <div className="mt-5 aspect-video overflow-hidden rounded-xl border border-border bg-surface-muted shadow-[var(--shadow-card)]">
          <iframe
            src={embed}
            title="Video del listing"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost mt-5 inline-flex"
        >
          Ver video del vinilo →
        </a>
      )}
    </section>
  );
}
