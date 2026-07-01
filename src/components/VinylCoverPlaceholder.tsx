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

  if (!isHero) {
    return (
      <>
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#e8e2d8] via-surface-muted to-[#d4cec4]"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={recordGrooves}
          aria-hidden
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-border bg-surface shadow-[var(--shadow-card)] ring-1 ring-border">
            <div
              className="absolute inset-2 rounded-full opacity-20"
              style={labelGrooves}
              aria-hidden
            />
            <span className="relative text-lg font-semibold text-muted-foreground">
              {initials}
            </span>
          </div>
          <span className="mt-3 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
            12&quot; · LP
          </span>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="absolute inset-0 bg-gradient-to-br from-inverse-deep via-[#141210] to-[#1a1510]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={recordGrooves}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(182,138,46,0.18),transparent_55%)]"
        aria-hidden
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
        <div className="relative flex h-36 w-36 items-center justify-center rounded-full border border-on-inverse/20 bg-inverse-deep/80 shadow-inner ring-2 ring-accent/25 sm:h-44 sm:w-44">
          <div
            className="absolute inset-2 rounded-full opacity-25"
            style={labelGrooves}
            aria-hidden
          />
          <span className="relative text-3xl font-bold tracking-wider text-on-inverse sm:text-4xl">
            {initials}
          </span>
        </div>
        <span className="mt-4 rounded border border-on-inverse/15 bg-inverse-deep/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-on-inverse/70">
          12&quot; · LP
        </span>
      </div>
    </>
  );
}
