"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandMark } from "@/components/BrandLogo";
import HomeTrustRow from "@/components/home/HomeTrustRow";
import {
  IconArrowRight,
  IconDisc,
  IconMapPin,
} from "@/components/icons";
import { formatPriceCLP } from "@/lib/format";
import type { Listing } from "@/types";

export const HERO_TURNTABLE_VISUAL = "/hero-turntable-featured.svg";

interface HomeHeroProps {
  featuredListing?: Listing | null;
}

export default function HomeHero({ featuredListing }: HomeHeroProps) {
  const [slideIndex, setSlideIndex] = useState(0);

  const artist = featuredListing?.artist ?? "Priku";
  const title = featuredListing?.title ?? "Romanian Minimal EP";
  const city = featuredListing?.city ?? "Concepción, Chile";
  const price = featuredListing?.price_clp ?? 10500;
  const detailHref = featuredListing?.id
    ? `/listings/${featuredListing.id}`
    : "#catalogo";

  return (
    <section data-testid="home-hero" className="pt-4 pb-0 sm:pt-6">
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,560px)] lg:gap-8 xl:gap-10">
        <div className="max-w-[32rem]">
          <p className="text-[10px] font-semibold uppercase leading-snug tracking-[0.14em] text-accent sm:text-[11px] sm:tracking-[0.12em]">
            VENDE · DESCUBRE · COMUNIDAD ELECTRÓNICA EN VINILO
          </p>
          <h1 className="mt-6 text-[2rem] font-bold leading-[1.14] tracking-[-0.02em] text-foreground sm:text-[2.35rem] lg:text-[2.65rem] xl:text-[2.85rem]">
            Donde los vinilos{" "}
            <span className="text-accent">cambian de manos,</span>{" "}
            no de historia.
          </h1>
          <div className="mt-6 max-w-[30rem] space-y-4 text-[15px] leading-[1.7] text-muted-foreground sm:text-base">
            <p>
              Vende ese disco que estás listo para dejar partir y deja que encuentre a
              alguien que lo disfrute como tú.
            </p>
            <p>
              Explora una comunidad donde todo parte desde la música electrónica: sin
              revolver entre catálogos generalistas, solo vinilos para filtrar
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#catalogo"
              data-testid="hero-explore-cta"
              className="btn-primary px-6 py-3"
            >
              <IconDisc className="h-4 w-4" aria-hidden />
              Explorar vinilos
              <IconArrowRight className="h-4 w-4 opacity-90" aria-hidden />
            </a>
            <Link
              href="/sell"
              data-testid="hero-sell-cta"
              className="btn-ghost px-6 py-3"
            >
              <BrandMark className="h-4 w-3 text-foreground" aria-hidden />
              Vender vinilo
            </Link>
          </div>

          <HomeTrustRow embedded />
        </div>

        <div
          data-testid="hero-cover-frame"
          className="relative mx-auto w-full lg:mx-0 lg:justify-self-end"
        >
          <div
            data-testid="home-featured-card"
            className="overflow-hidden rounded-[1.35rem] bg-[#080808] shadow-[0_28px_56px_rgb(8_8_8_/_32%)]"
          >
            <div className="relative aspect-[4/3] overflow-hidden lg:aspect-[16/9]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HERO_TURNTABLE_VISUAL}
                alt="Vinilo destacado en tornamesa"
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/20 to-transparent" />
              <span className="absolute left-5 top-5 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
                Nuevo ingreso
              </span>
            </div>

            <div className="px-5 pb-4 pt-4 text-on-inverse sm:px-6 sm:pb-5 lg:flex lg:items-end lg:justify-between lg:gap-4 lg:px-5 lg:py-3 lg:pb-3">
              <div className="min-w-0 space-y-0.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-on-inverse/60">
                  {artist}
                </p>
                <p className="text-xl font-semibold leading-tight sm:text-2xl lg:text-lg">
                  {title}
                </p>
                <p className="flex items-center gap-1.5 pt-1 text-sm text-on-inverse/55 lg:text-[13px]">
                  <IconMapPin className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  {city}
                </p>
                <p className="pt-2 text-[1.75rem] font-bold tabular-nums tracking-tight lg:pt-1 lg:text-2xl">
                  {formatPriceCLP(price)}
                </p>
              </div>
              <Link
                href={detailHref}
                className="btn-ghost mt-4 w-full border-on-inverse/30 bg-transparent py-2.5 text-on-inverse hover:border-on-inverse/50 hover:bg-on-inverse/10 lg:mt-0 lg:w-auto lg:shrink-0 lg:px-4"
              >
                Ver detalle
                <IconArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex justify-center gap-1.5 pb-4 lg:pb-3" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlideIndex(i)}
                  className={`h-1 rounded-full transition ${
                    slideIndex === i ? "w-5 bg-accent" : "w-1 bg-on-inverse/30"
                  }`}
                  tabIndex={-1}
                  aria-hidden
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
