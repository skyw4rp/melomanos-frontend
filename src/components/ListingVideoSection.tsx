import { youtubeEmbedUrl } from "@/lib/listing-grading";

interface ListingVideoSectionProps {
  videoUrl?: string | null;
}

export default function ListingVideoSection({ videoUrl }: ListingVideoSectionProps) {
  const url = videoUrl?.trim();
  if (!url) return null;

  const embed = youtubeEmbedUrl(url);

  return (
    <section className="mt-12 rounded-2xl border border-fuchsia-500/25 bg-gradient-to-br from-violet-950/30 via-[#120a1f] to-fuchsia-950/15 p-6 sm:p-8">
      <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300">
        Video del vinilo
      </h2>
      <p className="mt-2 text-sm text-zinc-400">
        Revisión en video para compradores de vinilo usado.
      </p>

      {embed ? (
        <div className="mt-5 aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/50 shadow-lg shadow-violet-950/40">
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
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-violet-400/40 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-200 transition hover:border-fuchsia-400/50 hover:text-white"
        >
          Ver video del vinilo →
        </a>
      )}
    </section>
  );
}
