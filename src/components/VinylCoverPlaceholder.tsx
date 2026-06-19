import { labelGrooves, recordGrooves } from "@/lib/vinyl-styles";

interface VinylCoverPlaceholderProps {
  title: string;
  artist: string;
  size: "card" | "hero";
}

export default function VinylCoverPlaceholder({
  title,
  artist,
  size,
}: VinylCoverPlaceholderProps) {
  const initials = `${title.charAt(0)}${artist.charAt(0)}`.toUpperCase();
  const isHero = size === "hero";

  return (
    <>
      <div
        className="absolute inset-0 bg-gradient-to-br from-violet-950 via-[#1a0f2e] to-fuchsia-950"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={recordGrooves}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(167,139,250,0.35),transparent_55%)]"
        aria-hidden
      />
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center ${isHero ? "p-8" : "p-4"}`}
      >
        <div
          className={`relative flex items-center justify-center rounded-full border border-white/20 bg-black/50 shadow-inner shadow-black/60 ring-2 ring-violet-400/30 ${
            isHero ? "h-36 w-36 sm:h-44 sm:w-44" : "h-20 w-20"
          }`}
        >
          <div
            className="absolute inset-2 rounded-full opacity-30"
            style={labelGrooves}
            aria-hidden
          />
          <span
            className={`relative font-bold tracking-wider text-violet-100 ${
              isHero ? "text-3xl sm:text-4xl" : "text-lg"
            }`}
          >
            {initials}
          </span>
        </div>
        <span
          className={`rounded border border-white/10 bg-black/40 font-mono uppercase tracking-[0.2em] text-violet-300/80 ${
            isHero ? "mt-4 px-3 py-1 text-xs" : "mt-3 px-2 py-0.5 text-[10px]"
          }`}
        >
          12&quot; · LP
        </span>
      </div>
    </>
  );
}
