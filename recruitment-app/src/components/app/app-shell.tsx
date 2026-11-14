"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Compass,
  Flower2,
  MessageCircle,
  Settings2,
  Sparkles,
  UserRound,
} from "lucide-react";
import { AiStatusChip } from "@/components/brand/ai-status-chip";
import { Avatar } from "@/components/brand/avatar";
import { Logo } from "@/components/brand/logo";
import { RoleSwitcher } from "@/components/app/role-switcher";
import { cn } from "@/lib/utils";
import type { NavCounts, PersonaSide } from "@/lib/repo";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: typeof Compass;
  count?: number;
};

function isActive(pathname: string, href: string) {
  if (href === "/discover") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({ item, pathname, mobile = false }: { item: NavItem; pathname: string; mobile?: boolean }) {
  const Icon = item.icon;
  const active = isActive(pathname, item.href);
  if (mobile) {
    return (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[9px] font-semibold",
          active ? "text-rose" : "text-ink-muted",
        )}
      >
        <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.2 : 1.8} />
        <span>{item.shortLabel}</span>
        {item.count ? (
          <span className="absolute right-[22%] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose px-1 text-[8px] font-bold text-white">
            {item.count}
          </span>
        ) : null}
      </Link>
    );
  }
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition",
        active ? "bg-surface text-ink shadow-[0_8px_24px_-18px_rgba(37,27,20,.55)]" : "text-ink-muted hover:bg-surface/60 hover:text-ink",
      )}
    >
      <Icon className={cn("h-[17px] w-[17px]", active ? "text-rose" : "text-ink-faint group-hover:text-ink-soft")} />
      <span className="flex-1">{item.label}</span>
      {item.count ? (
        <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", active ? "bg-rose text-white" : "bg-ink/5 text-ink-muted")}>{item.count}</span>
      ) : null}
    </Link>
  );
}

export function AppShell({
  children,
  side,
  name,
  headline,
  monogram,
  palette,
  eventName,
  eventDate,
  counts,
  rosesRemaining,
  rosesTotal,
  roles,
  activeRoleId,
}: {
  children: ReactNode;
  side: PersonaSide;
  name: string;
  headline: string;
  monogram: string;
  palette: string;
  eventName: string;
  eventDate: string;
  counts: NavCounts;
  rosesRemaining: number;
  rosesTotal: number;
  roles: Array<{ id: string; title: string }>;
  activeRoleId: string | null;
}) {
  const pathname = usePathname();
  const navItems: NavItem[] = [
    { href: "/discover", label: "Discover", shortLabel: "Discover", icon: Compass },
    { href: "/matches", label: "Matches", shortLabel: "Matches", icon: MessageCircle, count: counts.matches },
    { href: "/roses", label: "Roses", shortLabel: "Roses", icon: Flower2, count: counts.rosesReceived },
    ...(side === "candidate"
      ? [{ href: "/tailor", label: "Tailor a profile", shortLabel: "Tailor", icon: Sparkles }]
      : []),
    { href: "/profile", label: "Profile", shortLabel: "Profile", icon: side === "candidate" ? UserRound : Building2 },
  ];
  const activeRoleTitle = roles.find((role) => role.id === activeRoleId)?.title;

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[278px] flex-col border-r border-line bg-[#F4EDE3] px-4 py-5 lg:flex">
        <div className="px-1.5">
          <Link href="/discover" aria-label="Rivet discover">
            <Logo />
          </Link>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-paper/70 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.11em] text-ink-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-rose" />
            Junction 2026 · Espoo
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-paper/55 p-3.5">
          <div className="flex items-center gap-3">
            <Avatar name={name} monogram={monogram} palette={palette} size="sm" square={side === "employer"} />
            <div className="min-w-0">
              <p className="truncate font-display text-[17px] leading-tight">{name}</p>
              <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-ink-muted">{headline}</p>
            </div>
          </div>
          {side === "employer" && (
            <div className="mt-3 border-t border-line pt-3">
              <RoleSwitcher roles={roles} activeRoleId={activeRoleId} />
            </div>
          )}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
            <Link href="/enter" className="text-[10px] font-semibold text-ink-muted transition hover:text-ink">
              Switch persona
            </Link>
            <Link href="/about-ai" className="text-[10px] font-semibold text-ink-muted transition hover:text-ink">
              About AI
            </Link>
          </div>
        </div>

        <nav className="mt-6 space-y-1" aria-label="Main">
          <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-faint">The event</p>
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        <div className="mt-6 rounded-2xl border border-line bg-paper/55 p-3.5">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
              <Flower2 className="h-3.5 w-3.5 text-rose" /> Roses left
            </p>
            <span className="text-[11px] font-bold text-ink">{rosesRemaining}/{rosesTotal}</span>
          </div>
          <div className="mt-2.5 flex gap-1">
            {Array.from({ length: rosesTotal }).map((_, index) => (
              <span
                key={index}
                className={cn("h-1.5 flex-1 rounded-full", index < rosesRemaining ? "bg-rose" : "bg-line")}
              />
            ))}
          </div>
          <p className="mt-2 text-[9.5px] leading-4 text-ink-faint">Free, equal, never for sale. A rose signals interest, not ability.</p>
        </div>

        <div className="mt-auto space-y-2 pt-6">
          <AiStatusChip />
          <p className="px-1 text-[9px] leading-4 text-ink-faint">
            {eventName}. All people, teams, and confirmations are fictional.
          </p>
          <Link href="/" className="block px-1 text-[9px] font-semibold text-ink-faint transition hover:text-ink">
            Back to landing page
          </Link>
        </div>
      </aside>

      <div className="lg:pl-[278px]">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur-md lg:hidden">
          <Link href="/discover" aria-label="Rivet discover">
            <Logo compact />
          </Link>
          <div className="flex items-center gap-2.5">
            <AiStatusChip compact />
            <Link href="/profile" aria-label="Your profile">
              <Avatar name={name} monogram={monogram} palette={palette} size="xs" square={side === "employer"} />
            </Link>
          </div>
        </header>
        {side === "employer" && roles.length > 0 && (
          <div className="flex items-center gap-2.5 border-b border-line bg-[#F4EDE3] px-4 py-2 lg:hidden">
            <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
              <Settings2 className="h-3 w-3" /> Hiring for
            </span>
            <div className="min-w-0 flex-1">
              <RoleSwitcher roles={roles} activeRoleId={activeRoleId} compact />
            </div>
          </div>
        )}
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:px-9 lg:pb-12 lg:pt-9">
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-line bg-paper/95 px-2 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
        aria-label="Mobile"
      >
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} mobile />
        ))}
      </nav>
    </div>
  );
}
