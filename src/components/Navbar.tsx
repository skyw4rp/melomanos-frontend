"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
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

const PRODUCT_NAV: {
  label: string;
  href: string;
  testId?: string;
  exploreActive?: boolean;
}[] = [
  { label: "Explorar", href: "/explorar", testId: "nav-marketplace", exploreActive: true },
  { label: "Nuevos ingresos", href: "/explorar" },
  { label: "Comunidad", href: "/" },
];

const iconBtnClass = "icon-btn";

const headerNavTextClass =
  "text-[length:var(--text-nav)] font-medium leading-none transition-ui focus-ring";

function navLinkClass(active: boolean) {
  return `relative shrink-0 whitespace-nowrap px-2.5 py-2 lg:px-3 ${headerNavTextClass} ${
    active
      ? "text-foreground after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px] after:rounded-full after:bg-accent"
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

function AccountMenu({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const name = formatProfileName(user);
  const initials = getUserInitials(user);
  const profileActive = pathname === "/profile" || pathname.startsWith("/profile/");

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        data-testid="nav-account-menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex max-w-[10rem] shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-2 transition xl:max-w-[11rem] 2xl:max-w-[12rem] ${
          profileActive || open
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
        <IconChevronDown
          className={`hidden h-4 w-4 shrink-0 text-muted-foreground transition-transform 2xl:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          data-testid="nav-account-dropdown"
          role="menu"
          className="dropdown-panel absolute right-0 z-50 mt-2 w-[min(100vw-2rem,14rem)] py-1.5"
        >
          <Link
            href="/profile"
            role="menuitem"
            data-testid="nav-profile"
            onClick={() => setOpen(false)}
            className={`block px-4 py-2.5 text-[length:var(--text-body-sm)] font-medium transition-ui hover:bg-surface-muted/60 ${
              profileActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mi perfil
          </Link>
          <Link
            href="/orders"
            role="menuitem"
            data-testid="nav-orders"
            onClick={() => setOpen(false)}
            className={`block px-4 py-2.5 text-[length:var(--text-body-sm)] font-medium transition-ui hover:bg-surface-muted/60 ${
              pathname === "/orders" || pathname.startsWith("/orders/")
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Compras y ventas
          </Link>
          <Link
            href="/sell"
            role="menuitem"
            data-testid="nav-sell"
            onClick={() => setOpen(false)}
            className={`block px-4 py-2.5 text-[length:var(--text-body-sm)] font-medium transition-ui hover:bg-surface-muted/60 ${
              pathname === "/sell"
                ? "text-accent"
                : "text-muted-foreground hover:text-accent"
            }`}
          >
            Vender vinilo
          </Link>
          <div className="my-1 border-t border-border/70" aria-hidden />
          <button
            type="button"
            role="menuitem"
            data-testid="nav-logout"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="block w-full px-4 py-2.5 text-left text-[length:var(--text-body-sm)] font-medium text-muted-foreground transition-ui hover:bg-surface-muted/60 hover:text-foreground"
          >
            Salir
          </button>
        </div>
      )}
    </div>
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

function ProductNavRow() {
  const pathname = usePathname();

  function isNavItemActive(item: (typeof PRODUCT_NAV)[number]) {
    if (item.exploreActive) return pathname === "/explorar";
    if (item.href === "/" && item.label === "Comunidad") {
      return pathname === "/";
    }
    return false;
  }

  return (
    <>
      {PRODUCT_NAV.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          {...(item.testId ? { "data-testid": item.testId } : {})}
          className={navLinkClass(isNavItemActive(item))}
        >
          {item.label}
        </Link>
      ))}
    </>
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

  const loggedIn = Boolean(user);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-surface/98 backdrop-blur-sm">
      {/* Row 1 — utility */}
      <div className="border-b border-border/50">
        <nav
          className="mx-auto max-w-[1440px] px-5 py-3 sm:px-8 sm:py-3.5"
          aria-label="Utilidades"
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto] items-center gap-x-3 gap-y-3 sm:gap-x-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:grid-rows-1 md:gap-y-0">
            <BrandLogo />

            <div className="col-start-2 row-start-1 flex shrink-0 items-center justify-end gap-1.5 sm:gap-2 md:col-start-3">
              {hydrated && loggedIn && user && (
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <NotificationBell iconOnly />
                  <MessagesIconLink unread={unreadMessages} />
                  <FavoritesIconLink />
                  <AccountMenu user={user} onLogout={handleLogout} />
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

            <div className="col-span-2 row-start-2 min-w-0 md:col-span-1 md:col-start-2 md:row-start-1">
              <NavbarSearch />
            </div>
          </div>
        </nav>
      </div>

      {/* Row 2 — product navigation */}
      <nav
        className="mx-auto max-w-[1440px] px-5 sm:px-8"
        aria-label="Navegación del marketplace"
        data-testid="nav-product-row"
      >
        <div className="flex gap-1 overflow-x-auto py-2.5 lg:gap-2 lg:py-3">
          <ProductNavRow />
        </div>
      </nav>
    </header>
  );
}
