"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AUTH_CHANGED_EVENT } from "@/lib/auth-events";
import { formatProfileName, getUserInitials } from "@/lib/auth";
import {
  getConversations,
  getMe,
  getStoredUser,
  getToken,
  logout,
  setStoredUser,
} from "@/lib/api";
import { MESSAGES_UPDATED_EVENT, totalUnreadCount } from "@/lib/messages";
import type { User } from "@/types";

const navLinkClass =
  "rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white sm:px-3";

const sellCtaClass =
  "rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-violet-950/50 transition hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-violet-900/40";

function ProfileChip({ user }: { user: User }) {
  const pathname = usePathname();
  const active = pathname === "/profile" || pathname.startsWith("/profile/");
  const name = formatProfileName(user);
  const initials = getUserInitials(user);

  return (
    <Link
      href="/profile"
      className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 transition sm:px-2.5 ${
        active
          ? "border-violet-400/50 bg-violet-950/60 shadow-[0_0_20px_-6px_rgba(139,92,246,0.5)]"
          : "border-violet-500/25 bg-violet-950/40 hover:border-violet-400/40 hover:bg-violet-900/50"
      }`}
      title={`${name} · Collector`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-bold text-white ring-2 ring-violet-400/30">
        {initials}
      </span>
      <span className="hidden min-w-0 sm:block">
        <span className="block truncate text-sm font-semibold leading-tight text-white">
          {name}
        </span>
        <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-violet-400/90">
          Collector
        </span>
      </span>
    </Link>
  );
}

function MessagesLink({ unread }: { unread: number }) {
  const pathname = usePathname();
  const active =
    pathname === "/messages" || pathname.startsWith("/messages/");

  return (
    <Link
      href="/messages"
      className={active ? `${navLinkClass} bg-white/10 text-white` : navLinkClass}
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="hidden sm:inline">Messages</span>
        <span className="sm:hidden">Msg</span>
        <span
          className="min-w-[1.25rem] rounded-full bg-fuchsia-500/25 px-1.5 py-0.5 text-center font-mono text-[10px] font-bold tabular-nums text-fuchsia-200 ring-1 ring-fuchsia-400/30"
          aria-label={`${unread} unread messages`}
        >
          {unread}
        </span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const loadSession = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setHydrated(true);
      return;
    }

    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      setHydrated(true);
      return;
    }

    try {
      const me = await getMe();
      setStoredUser(me);
      setUser(me);
    } catch {
      logout();
      setUser(null);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession, pathname]);

  useEffect(() => {
    function onAuthChange() {
      loadSession();
    }
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChange);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChange);
  }, [loadSession]);

  const refreshUnread = useCallback(() => {
    if (!user || !getToken()) {
      setUnreadMessages(0);
      return;
    }
    getConversations()
      .then((convs) => setUnreadMessages(totalUnreadCount(convs)))
      .catch(() => setUnreadMessages(0));
  }, [user]);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread, pathname]);

  useEffect(() => {
    window.addEventListener(MESSAGES_UPDATED_EVENT, refreshUnread);
    return () => window.removeEventListener(MESSAGES_UPDATED_EVENT, refreshUnread);
  }, [refreshUnread]);

  function handleLogout() {
    logout();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  function linkClass(href: string) {
    const active =
      pathname === href || (href !== "/" && pathname.startsWith(href));
    return active
      ? `${navLinkClass} bg-white/10 text-white`
      : navLinkClass;
  }

  const loggedIn = Boolean(user);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0c0a12]/80 backdrop-blur-md">
      <nav className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="group flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-bold text-white shadow-lg shadow-violet-900/40">
              M
            </span>
            <span className="hidden font-semibold tracking-tight text-white group-hover:text-violet-200 sm:inline sm:text-lg">
              Melomanos Market
            </span>
          </Link>

          <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
            <Link href="/" className={linkClass("/")}>
              <span className="hidden sm:inline">Marketplace</span>
              <span className="sm:hidden">Crate</span>
            </Link>

            {hydrated && loggedIn && user && (
              <>
                <Link
                  href="/sell"
                  className={`${sellCtaClass} ${pathname === "/sell" ? "ring-2 ring-violet-300/50" : ""}`}
                >
                  + Sell Vinyl
                </Link>

                <Link href="/favorites" className={linkClass("/favorites")}>
                  <span className="hidden sm:inline">Favorites</span>
                  <span className="sm:hidden" aria-label="Favorites">
                    ♥
                  </span>
                </Link>

                <MessagesLink unread={unreadMessages} />

                <ProfileChip user={user} />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-violet-400/50 hover:bg-white/5 hover:text-white lg:inline-block"
                >
                  Logout
                </button>
              </>
            )}

            {hydrated && !loggedIn && (
              <Link href="/login" className={linkClass("/login")}>
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
