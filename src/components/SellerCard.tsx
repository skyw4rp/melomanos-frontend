"use client";

import { useEffect, useState } from "react";
import DiggingScorePanel from "@/components/DiggingScorePanel";
import SellerReputationPanel from "@/components/SellerReputationPanel";
import { getDiggingScore, getSellerReputation } from "@/lib/api";
import { resolveSellerDisplay } from "@/lib/listing-normalize";
import { trustLevelLabel } from "@/lib/reputation";
import type { DiggingScore, Listing, SellerReputation } from "@/types";

interface SellerCardProps {
  listing: Listing;
  sellerId?: number;
}

export default function SellerCard({ listing, sellerId }: SellerCardProps) {
  const seller = resolveSellerDisplay(listing);
  const resolvedSellerId = sellerId ?? listing.seller_id;
  const [reputation, setReputation] = useState<SellerReputation | null>(null);
  const [diggingScore, setDiggingScore] = useState<DiggingScore | null>(null);
  const [loadingReputation, setLoadingReputation] = useState(false);

  useEffect(() => {
    if (resolvedSellerId == null) return;

    let cancelled = false;
    setLoadingReputation(true);

    void getSellerReputation(resolvedSellerId)
      .then((data) => {
        if (!cancelled) setReputation(data);
      })
      .catch(() => {
        if (!cancelled) setReputation(null);
      });

    void getDiggingScore(resolvedSellerId)
      .then((data) => {
        if (!cancelled) setDiggingScore(data);
      })
      .catch(() => {
        if (!cancelled) setDiggingScore(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingReputation(false);
      });

    return () => {
      cancelled = true;
    };
  }, [resolvedSellerId]);

  const roleLabel = reputation
    ? trustLevelLabel(reputation.trust_level)
    : seller.role;

  return (
    <aside className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-950/50 to-[#0d0a14] p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/90">
        Vendedor
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{seller.name}</p>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-violet-400/80">
        {roleLabel}
      </p>
      <p className="mt-1 text-sm text-zinc-400">{seller.city}</p>

      <SellerReputationPanel
        reputation={reputation}
        loading={loadingReputation && resolvedSellerId != null}
        compact
      />

      <DiggingScorePanel diggingScore={diggingScore} compact />
    </aside>
  );
}
