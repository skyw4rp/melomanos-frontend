"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";

export default function MessagesPage() {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/90">
        Inbox
      </p>
      <h1 className="mt-2 text-3xl font-bold text-white">Messages</h1>
      <p className="mt-3 text-zinc-400">
        Your conversations with buyers and sellers will appear here.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block text-sm font-medium text-violet-300 hover:text-violet-200"
      >
        ← Back to marketplace
      </Link>
    </div>
  );
}
