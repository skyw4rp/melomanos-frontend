"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearToken, getToken } from "@/lib/api";

const navLinkClass =
  "rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(Boolean(getToken()));
  }, [pathname]);

  function handleLogout() {
    clearToken();
    setLoggedIn(false);
    router.push("/login");
  }

  function linkClass(href: string) {
    const active = pathname === href || (href !== "/" && pathname.startsWith(href));
    return active
      ? `${navLinkClass} bg-white/10 text-white`
      : navLinkClass;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0c0a12]/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-bold text-white shadow-lg shadow-violet-900/40">
            M
          </span>
          <span className="text-lg font-semibold tracking-tight text-white group-hover:text-violet-200">
            Melomanos Market
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/" className={linkClass("/")}>
            Marketplace
          </Link>
          <Link href="/favorites" className={linkClass("/favorites")}>
            Favorites
          </Link>
          {loggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="ml-1 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-violet-400/50 hover:bg-white/5 hover:text-white"
            >
              Logout
            </button>
          ) : (
            <Link href="/login" className={linkClass("/login")}>
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
