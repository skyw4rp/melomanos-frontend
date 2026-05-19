"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isLoggedIn } from "@/lib/api";
import MessageForm from "@/components/MessageForm";

interface ListingDetailClientProps {
  listingId: number;
}

export default function ListingDetailClient({
  listingId,
}: ListingDetailClientProps) {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, []);

  if (!loggedIn) {
    return (
      <p className="mt-8 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-5 text-sm text-zinc-400">
        <Link href="/login" className="font-medium text-violet-300 hover:text-violet-200">
          Log in
        </Link>{" "}
        to message the seller about this listing.
      </p>
    );
  }

  return <MessageForm listingId={listingId} />;
}
