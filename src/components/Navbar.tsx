"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import NotificationBell from "@/components/NotificationBell";
import {
  IconChevronDown,
  IconHeart,
  IconMessage,
  IconSearch,
  ICON_SIZE_MD,
} from "@/components/icons";
import { AUTH_CHANGED_EVENT } from "@/lib/auth-events";
import { formatProfileName, getUserInitials } from "@/lib/auth";
import { dispatchHomeSearch, scrollToCatalog } from "@/lib/home-search";
import {
  getConversations,
  getMe,
  getToken,
  isSessionExpiredError,
  logout,
  setStoredUser,
} from "@/lib/api";
import { MESSAGES_UPDATED_EVENT, totalUnreadCount } from "@/lib/messages";
import type { User } from "@/types";

const CENTER_NAV: { label: string; href: string; testId?: string; homeActive?: boolean }[] = [
  { label: "Explorar", href: "/#catalogo", testId: "nav-marketplace", homeActive: true },
  { label: "Sellos", href: "/#catalogo" },
  { label: "Artistas", href: "/#catalogo" },
  { label: "Nuevos ingresos", href: "/#nuevos-ingresos" },
  { label: "Guía del digger", href: "/#guia-digger" },
];

const iconBtnClass = "icon-btn";

function navLinkClass(active: boolean) {
  return `relative whitespace-nowrap px-3 py-2 text-[13px] font-medium transition-ui focus-ring ${
    active
      ? "text-foreground after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px] after:rounded-full after:bg-accent"
      : "text-muted-foreground hover:text-foreground"
  }`;
}

function NavbarSearch() {
  const [query, setQuery] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    scrollToCatalog();
    dispatchHomeSearch(query);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="hidden min-w-[200px] flex-1 md:block md:max-w-[240px] lg:max-w-[280px] xl:max-w-[300px]"
    >
      <label htmlFor="home-search" className="sr-only">
        Buscar vinilos, artistas, sellos
      </label>
      <div className="relative">
        <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="home-search"
          type="search"
          data-testid="home-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar vinilos, artistas, sellos..."
          className="w-full rounded-full border border-border/80 bg-[#ede8df] py-2 pl-10 pr-14 text-[13px] text-foreground transition-ui placeholder:text-[var(--color-text-placeholder)] focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/15"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-surface/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline">
          ⌘ K
        </kbd>
      </div>
    </form>
  );
}

function ProfileChip({ user }: { user: User }) {
  const pathname = usePathname();
  const active = pathname === "/profile" || pathname.startsWith("/profile/");
  const name = formatProfileName(user);
  const initials = getUserInitials(user);

  return (
    <Link
      href="/profile"
      data-testid="nav-profile"
      className={`flex max-w-[12rem] items-center gap-2 rounded-full border py-1 pl-1 pr-2 transition sm:max-w-none sm:pr-2.5 ${
        active
          ? "border-accent/35 bg-surface"
          : "border-border/80 bg-surface hover:border-accent/25"
      }`}
      title={`${name} · Coleccionista`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {initials}
      </span>
      <span className="hidden min-w-0 md:block">
        <span className="block truncate text-[13px] font-semibold leading-tight text-foreground">
          {name}
        </span>
        <span className="block text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
          Coleccionista
        </span>
      </span>
      <IconChevronDown className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground md:block" />
    </Link>
  );
}

function MessagesIconLink({ unread }: { unread: number }) {
  const pathname = usePathname();
  const active =
    pathname === "/messages" || pathname.startsWith("/messages/");

  return (
    <Link
      href="/messages"
      data-testid="nav-messages"
      aria-label={unread > 0 ? `Mensajes, ${unread} sin leer` : "Mensajes"}
      className={`${iconBtnClass} ${active ? "bg-surface-muted/80" : ""}`}
    >
      <IconMessage className={ICON_SIZE_MD} />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 min-w-[1rem] rounded-full bg-accent px-1 text-center text-[9px] font-bold text-primary-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}

function FavoritesIconLink() {
  const pathname = usePathname();
  const active = pathname === "/favorites" || pathname.startsWith("/favorites/");

  return (
    <Link
      href="/favorites"
      data-testid="nav-favorites"
      aria-label="Favoritos"
      className={`${iconBtnClass} ${active ? "bg-surface-muted/80" : ""}`}
    >
      <IconHeart className={ICON_SIZE_MD} />
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
      setUnreadMessages(0);
      setHydrated(true);
      return;
    }

    setUser(null);

    try {
      const me = await getMe();
      setStoredUser(me);
      setUser(me);
    } catch (err) {
      if (!isSessionExpiredError(err)) {
        logout();
      }
      setUser(null);
      setUnreadMessages(0);
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

  function isNavItemActive(item: (typeof CENTER_NAV)[number]) {
    if (item.homeActive) return pathname === "/";
    return false;
  }

  const loggedIn = Boolean(user);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-surface/98 backdrop-blur-sm">
      <nav className="mx-auto max-w-[1440px] px-5 py-3 sm:px-8">
        <div className="flex items-center gap-4 lg:gap-6">
          <BrandLogo />

          <div className="hidden flex-1 items-center justify-center lg:flex">
            {CENTER_NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                {...(item.testId ? { "data-testid": item.testId } : {})}
                className={navLinkClass(isNavItemActive(item))}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2 lg:flex-none">
            <NavbarSearch />

            {hydrated && loggedIn && user && (
              <div className="flex items-center gap-0.5 sm:gap-1">
                <Link
                  href="/sell"
                  data-testid="nav-sell"
                  className="hidden rounded-lg px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition hover:text-accent lg:inline-block"
                >
                  Vender vinilo
                </Link>

                <Link
                  href="/orders"
                  data-testid="nav-orders"
                  className="hidden rounded-lg px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition hover:text-foreground lg:inline-block"
                >
                  Compras y ventas
                </Link>

                <NotificationBell iconOnly />

                <MessagesIconLink unread={unreadMessages} />

                <FavoritesIconLink />

                <ProfileChip user={user} />

                <button
                  type="button"
                  onClick={handleLogout}
                  data-testid="nav-logout"
                  className="hidden rounded-lg px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition hover:text-foreground 2xl:inline-block"
                >
                  Salir
                </button>
              </div>
            )}

            {hydrated && !loggedIn && (
              <Link
                href="/login"
                data-testid="nav-login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>

        <div className="mt-2.5 flex gap-2 overflow-x-auto pb-0.5 lg:hidden">
          {CENTER_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              {...(item.testId ? { "data-testid": `${item.testId}-mobile` } : {})}
              className={`shrink-0 px-2 py-1 text-xs font-medium ${
                isNavItemActive(item)
                  ? "text-foreground underline decoration-accent decoration-2 underline-offset-4"
                  : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
