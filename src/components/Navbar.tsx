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
  ICON_SIZE_NAV,
} from "@/components/icons";
import { AUTH_CHANGED_EVENT } from "@/lib/auth-events";
import { formatProfileName, getUserInitials } from "@/lib/auth";
import { dispatchHomeSearch, scrollToCatalog, setPendingHomeSearch } from "@/lib/home-search";
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

const CENTER_NAV: { label: string; href: string; testId?: string; exploreActive?: boolean }[] = [
  { label: "Explorar", href: "/explorar", testId: "nav-marketplace", exploreActive: true },
  { label: "Sellos", href: "/explorar" },
  { label: "Artistas", href: "/explorar" },
  { label: "Nuevos ingresos", href: "/#nuevos-ingresos" },
  { label: "Guía del digger", href: "/#guia-digger" },
];

const iconBtnClass = "icon-btn";

const headerNavTextClass =
  "text-[length:var(--text-nav)] font-medium leading-none transition-ui focus-ring";

function navLinkClass(active: boolean) {
  return `relative whitespace-nowrap px-2.5 py-2 lg:px-2 xl:px-3 ${headerNavTextClass} ${
    active
      ? "text-foreground after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px] after:rounded-full after:bg-accent"
      : "text-muted-foreground hover:text-foreground"
  }`;
}

function headerActionLinkClass(active: boolean, accentHover = false) {
  return `hidden rounded-lg px-2.5 py-2 xl:px-3 ${headerNavTextClass} xl:inline-block ${
    active
      ? "text-foreground"
      : accentHover
        ? "text-muted-foreground hover:text-accent"
        : "text-muted-foreground hover:text-foreground"
  }`;
}

function NavbarSearch() {
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (pathname === "/explorar") {
      dispatchHomeSearch(trimmed);
      scrollToCatalog();
      return;
    }
    setPendingHomeSearch(trimmed);
    router.push("/explorar");
  }

  return (
    <form onSubmit={handleSubmit} className="w-full min-w-0">
      <label htmlFor="home-search" className="sr-only">
        Buscar vinilos, artistas, sellos
      </label>
      <div className="relative w-full">
        <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          id="home-search"
          type="search"
          data-testid="home-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar vinilos, artistas, sellos..."
          className="input-search w-full py-2.5 pl-11 pr-4"
        />
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
      className={`flex max-w-[10rem] shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-2 transition xl:max-w-[11rem] 2xl:max-w-[12rem] ${
        active
          ? "border-accent/35 bg-surface"
          : "border-border/80 bg-surface hover:border-accent/25"
      }`}
      title={`${name} · Coleccionista`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {initials}
      </span>
      <span className="hidden min-w-0 md:block">
        <span className="block max-w-[5.5rem] truncate text-[length:var(--text-nav)] font-semibold leading-tight text-foreground xl:max-w-[6.5rem] 2xl:max-w-[8rem]">
          {name}
        </span>
        <span className="hidden truncate text-[length:var(--text-caption)] font-medium uppercase tracking-[0.12em] text-muted-foreground 2xl:block">
          Coleccionista
        </span>
      </span>
      <IconChevronDown className="hidden h-4 w-4 shrink-0 text-muted-foreground 2xl:block" />
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
      <IconMessage className={ICON_SIZE_NAV} />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 min-w-[1.125rem] rounded-full bg-accent px-1 text-center text-[length:var(--text-caption)] font-bold text-primary-foreground">
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
      <IconHeart className={ICON_SIZE_NAV} />
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
    if (item.exploreActive) return pathname === "/explorar";
    return false;
  }

  const loggedIn = Boolean(user);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-surface/98 backdrop-blur-sm">
      <nav className="mx-auto max-w-[1440px] px-5 py-3.5 sm:px-8 sm:py-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4 lg:gap-4 xl:gap-5">
          <BrandLogo />

          <div className="hidden shrink-0 items-center lg:flex">
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

          <div className="hidden min-w-[240px] flex-1 md:block lg:min-w-[260px]">
            <NavbarSearch />
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {hydrated && loggedIn && user && (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Link
                  href="/sell"
                  data-testid="nav-sell"
                  className={headerActionLinkClass(pathname === "/sell", true)}
                >
                  Vender vinilo
                </Link>

                <Link
                  href="/orders"
                  data-testid="nav-orders"
                  className={headerActionLinkClass(
                    pathname === "/orders" || pathname.startsWith("/orders/")
                  )}
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
                  className={`hidden rounded-lg px-3 py-2 ${headerNavTextClass} text-muted-foreground hover:text-foreground 2xl:inline-block`}
                >
                  Salir
                </button>
              </div>
            )}

            {hydrated && !loggedIn && (
              <Link
                href="/login"
                data-testid="nav-login"
                className={`rounded-lg px-3 py-2 ${headerNavTextClass} text-muted-foreground hover:text-foreground`}
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>

        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-0.5 lg:hidden">
          {CENTER_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              {...(item.testId ? { "data-testid": `${item.testId}-mobile` } : {})}
              className={`shrink-0 px-2.5 py-1.5 text-[length:var(--text-body-sm)] font-medium ${
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
