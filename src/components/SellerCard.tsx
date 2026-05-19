import type { Listing } from "@/types";

interface SellerCardProps {
  listing: Listing;
}

export default function SellerCard({ listing }: SellerCardProps) {
  const sellerName = listing.seller_name?.trim() || "Melomanos Collector";
  const sellerCity = listing.seller_city?.trim() || listing.city;

  return (
    <aside className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-950/50 to-[#0d0a14] p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/90">
        Seller
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{sellerName}</p>
      <p className="mt-1 text-sm text-zinc-400">{sellerCity}</p>

      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Rating</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg tracking-widest text-amber-300/90" aria-hidden>
            ★★★★☆
          </span>
          <span className="text-sm text-zinc-400">12 reviews</span>
        </div>
        <p className="mt-1 text-[10px] text-zinc-600">Placeholder · seller ratings coming soon</p>
      </div>
    </aside>
  );
}
