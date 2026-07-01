import Link from "next/link";

export default function HomeCommunityCard() {
  return (
    <section className="relative min-h-[220px] overflow-hidden rounded-2xl bg-[#080808] shadow-[var(--shadow-card-hover)]">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,#b68a2e22,transparent_55%),linear-gradient(135deg,#0a0a0a_0%,#1a1410_50%,#0b0b0b_100%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,0.03) 40px,rgba(255,255,255,0.03) 41px)",
        }}
        aria-hidden
      />
      <div className="relative flex h-full flex-col justify-center p-6 sm:p-7">
        <h2 className="text-lg font-bold leading-snug text-on-inverse sm:text-xl">
          ¿Tienes un sello o eres DJ?
        </h2>
        <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-on-inverse/65">
          Únete a la comunidad{" "}
          <span className="text-accent">Melómanos</span> y conecta con diggers de
          verdad.
        </p>
        <Link
          href="/sell"
          className="mt-5 inline-flex w-fit rounded-xl border border-accent/60 bg-accent px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-95"
        >
          Publicar vinilo
        </Link>
      </div>
    </section>
  );
}
