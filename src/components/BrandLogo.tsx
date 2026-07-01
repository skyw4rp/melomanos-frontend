import Link from "next/link";

/**
 * Official Melómanos Market brand lockup — traced from
 * workspace/design_references/melomanos_marketplace_reference.jpeg
 * (vertical groove curves + M-shaped center mark).
 */
export function BrandMark({ className = "h-11 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M5 4c0 12 0.5 24 0 36"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path
        d="M8 6c2 10 2 22 0 32"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M11 8c1.5 8 2 16 1.5 26"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M14 6 L11 22 L17 22 L14 38"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 14 Q14 18 17 14"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M21 8c-1.5 8-2 16-1.5 26"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M24 6c-2 10-2 22 0 32"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M27 4c0 12-0.5 24 0 36"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.3"
      />
    </svg>
  );
}

type BrandLogoProps = {
  href?: string;
  className?: string;
  compact?: boolean;
};

export default function BrandLogo({
  href = "/",
  className = "",
  compact = false,
}: BrandLogoProps) {
  const content = (
    <span
      data-testid="brand-logo"
      className={`group inline-flex items-center gap-3 text-foreground ${className}`}
    >
      <BrandMark className={compact ? "h-9 w-6" : "h-11 w-8"} />
      <span className="flex flex-col justify-center leading-none">
        <span
          className={`font-bold tracking-[0.08em] text-foreground ${compact ? "text-[11px]" : "text-[13px] sm:text-sm"}`}
        >
          MELÓMANOS
        </span>
        <span
          className={`mt-1 font-semibold tracking-[0.28em] text-accent ${compact ? "text-[8px]" : "text-[9px] sm:text-[10px]"}`}
        >
          MARKET
        </span>
      </span>
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="shrink-0 transition hover:opacity-90"
        aria-label="Melómanos Market — inicio"
      >
        {content}
      </Link>
    );
  }

  return content;
}
