"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatProfileName, getUserInitials } from "@/lib/auth";
import { getStoredUser, getToken, logout } from "@/lib/api";
import type { User } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setUser(getStoredUser());
  }, [router]);

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-zinc-500">
        Loading profile…
      </div>
    );
  }

  const name = formatProfileName(user);
  const initials = getUserInitials(user);

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/90">
        Your crate
      </p>

      <div className="mt-6 flex items-center gap-4 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/50 to-[#0d0a14] p-6">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-2xl font-bold text-white ring-2 ring-violet-400/40">
          {initials}
        </span>
        <div>
          <h1 className="text-2xl font-bold text-white">{name}</h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-violet-400/90">
            Collector
          </p>
          <p className="mt-2 text-sm text-zinc-400">{user.email}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-2">
        <Link
          href="/favorites"
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200 transition hover:border-violet-400/40 hover:bg-white/[0.06]"
        >
          Favorites
        </Link>
        <Link
          href="/messages"
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200 transition hover:border-violet-400/40 hover:bg-white/[0.06]"
        >
          Messages
        </Link>
        <Link
          href="/sell"
          className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-center text-sm font-semibold text-white"
        >
          + Sell Vinyl
        </Link>
      </div>

      <button
        type="button"
        onClick={() => {
          logout();
          router.push("/login");
        }}
        className="mt-8 w-full rounded-xl border border-white/15 py-3 text-sm font-medium text-zinc-300 transition hover:border-red-400/40 hover:text-red-200 lg:hidden"
      >
        Logout
      </button>

      <Link
        href="/"
        className="mt-6 inline-block text-sm font-medium text-violet-300 hover:text-violet-200"
      >
        ← Back to marketplace
      </Link>
    </div>
  );
}
