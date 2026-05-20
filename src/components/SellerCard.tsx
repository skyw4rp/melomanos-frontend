import { resolveSellerDisplay } from "@/lib/listing-normalize";
import type { Listing } from "@/types";

interface SellerCardProps {
  listing: Listing;
}

export default function SellerCard({ listing }: SellerCardProps) {
  const seller = resolveSellerDisplay(listing);

  return (
    <aside className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-950/50 to-[#0d0a14] p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/90">
        Seller
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{seller.name}</p>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-violet-400/80">
        {seller.role}
      </p>
      <p className="mt-1 text-sm text-zinc-400">{seller.city}</p>

      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Rating</p>
        <p className="mt-2 text-sm text-zinc-400">Reviews coming soon</p>
      </div>
    </aside>
  );
}
