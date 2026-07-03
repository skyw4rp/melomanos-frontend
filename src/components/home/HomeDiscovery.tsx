"use client";

import HomeBenefitsStrip from "@/components/home/HomeBenefitsStrip";
import HomeCommunityCard from "@/components/home/HomeCommunityCard";
import HomeHero from "@/components/home/HomeHero";
import HomeMetricsBand from "@/components/home/HomeMetricsBand";
import HomeNewArrivals from "@/components/home/HomeNewArrivals";
import { useListingsQuery } from "@/lib/useListingsQuery";

export default function HomeDiscovery() {
  const { data } = useListingsQuery({ skip: 0, limit: 20 });

  return (
    <section className="space-y-0">
      <HomeHero />
      <HomeMetricsBand />
      <HomeNewArrivals listings={data?.items ?? []} />
      <div className="mt-16 grid gap-8 lg:grid-cols-[1fr_minmax(300px,380px)] lg:items-start lg:gap-10">
        <HomeBenefitsStrip />
        <HomeCommunityCard />
      </div>
    </section>
  );
}
