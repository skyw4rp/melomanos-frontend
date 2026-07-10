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
    <aside
      data-testid="listing-seller-card"
      className="rounded-2xl border border-border/80 bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5"
    >
      <p className="editorial-label">Vendedor</p>
      <p className="mt-1.5 text-lg font-semibold text-foreground">{seller.name}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
        {roleLabel}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{seller.city}</p>

      <SellerReputationPanel
        reputation={reputation}
        loading={loadingReputation && resolvedSellerId != null}
        compact
        editorial
      />

      <DiggingScorePanel diggingScore={diggingScore} compact editorial />
    </aside>
  );
}
