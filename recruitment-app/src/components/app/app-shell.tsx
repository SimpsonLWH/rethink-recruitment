"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ClipboardCheck,
  Compass,
  Home,
  Info,
  MessageCircle,
  Settings2,
  SlidersHorizontal,
  UserRound,
  Users,
} from "lucide-react";
import { AiStatusLine } from "@/components/brand/ai-status-line";
import { Avatar } from "@/components/brand/avatar";
import { Logo } from "@/components/brand/logo";
import { RoleSwitcher } from "@/components/app/role-switcher";
import { PRIORITY_INTRO, PriorityIntroIcon } from "@/lib/brand";
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
          "relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium",
          active ? "text-accent" : "text-ink-muted",
        )}
      >
        <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.1 : 1.7} />
        <span>{item.shortLabel}</span>
        {item.count ? (
          <span className="absolute right-[18%] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-white">
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
        active ? "bg-surface text-ink" : "text-ink-muted hover:bg-surface/60 hover:text-ink",
      )}
    >
      <Icon className={cn("h-[17px] w-[17px]", active ? "text-accent" : "text-ink-faint group-hover:text-ink-soft")} />
      <span className="flex-1">{item.label}</span>
      {item.count ? (
        <span className={cn("rounded-full px-1.5 py-0.5 text-[11px] font-semibold", active ? "bg-accent text-white" : "bg-ink/5 text-ink-muted")}>{item.count}</span>
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
  counts,
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
  eventDate?: string;
  counts: NavCounts;
  roles: Array<{ id: string; title: string }>;
  activeRoleId: string | null;
}) {
  const pathname = usePathname();
  const navItems: NavItem[] =
    side === "candidate"
      ? [
          { href: "/dashboard", label: "Home", shortLabel: "Home", icon: Home },
          { href: "/discover", label: "Discover roles", shortLabel: "Discover", icon: Compass },
          { href: "/assessments", label: "Assessments", shortLabel: "Assess", icon: ClipboardCheck },
          { href: "/matches", label: "Matches", shortLabel: "Matches", icon: MessageCircle, count: counts.matches },
          {
            href: "/priority-intros",
            label: PRIORITY_INTRO.navLabel,
            shortLabel: PRIORITY_INTRO.shortLabel,
            icon: PriorityIntroIcon,
            count: counts.priorityIntrosReceived,
          },
          { href: "/invitations", label: "Invitations", shortLabel: "Invites", icon: Users, count: counts.invitations },
          { href: "/profile", label: "Profile", shortLabel: "Profile", icon: UserRound },
        ]
      : [
          { href: "/dashboard", label: "Home", shortLabel: "Home", icon: Home },
          { href: "/discover", label: "Review candidates", shortLabel: "Review", icon: Compass },
          { href: "/discovery", label: "Discovery lane", shortLabel: "Discover", icon: Users },
          { href: "/roles", label: "Role cards", shortLabel: "Roles", icon: SlidersHorizontal },
          { href: "/matches", label: "Matches", shortLabel: "Matches", icon: MessageCircle, count: counts.matches },
          {
            href: "/priority-intros",
            label: PRIORITY_INTRO.navLabel,
            shortLabel: PRIORITY_INTRO.shortLabel,
            icon: PriorityIntroIcon,
            count: counts.priorityIntrosReceived,
          },
          { href: "/profile", label: "Profile", shortLabel: "Profile", icon: Building2 },
        ];

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-line bg-paper px-4 py-6 lg:flex">
        <div className="flex items-start justify-between px-1">
          <Link href="/discover" aria-label="Rivet review">
            <Logo />
          </Link>
          <Link
            href="/how-it-works"
            aria-label="How Rivet works"
            className="mt-1 flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface hover:text-ink"
          >
            <Info className="h-4 w-4" />
          </Link>
        </div>
        <p className="mt-3 px-1 text-[11px] text-ink-faint">Junction 2026 · Espoo</p>

        <div className="mt-6 rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center gap-3">
            <Avatar name={name} monogram={monogram} palette={palette} size="sm" square={side === "employer"} />
            <div className="min-w-0">
              <p className="font-display text-[17px] leading-tight">{name}</p>
              <p className="mt-1 line-clamp-2 text-[12px] leading-4 text-ink-muted">{headline}</p>
            </div>
          </div>
          {side === "employer" && (
            <div className="mt-3 border-t border-line pt-3">
              <RoleSwitcher roles={roles} activeRoleId={activeRoleId} />
            </div>
          )}
          <div className="mt-3 border-t border-line pt-3">
            <Link href="/enter" className="text-[11px] font-medium text-ink-muted transition hover:text-ink">
              Switch account
            </Link>
          </div>
        </div>

        <nav className="mt-6 space-y-1" aria-label="Main">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        <div className="mt-auto space-y-3 pt-6">
          <AiStatusLine />
          <p className="px-1 text-[11px] leading-5 text-ink-faint">
            {eventName}. Every person, team and confirmation is fictional.
          </p>
          <Link href="/" className="block px-1 text-[11px] font-medium text-ink-faint transition hover:text-ink">
            Back to the concept
          </Link>
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur-md lg:hidden">
          <Link href="/discover" aria-label="Rivet review">
            <Logo compact />
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/how-it-works"
              aria-label="How Rivet works"
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted"
            >
              <Info className="h-4 w-4" />
            </Link>
            <Link href="/profile" aria-label="Your profile">
              <Avatar name={name} monogram={monogram} palette={palette} size="xs" square={side === "employer"} />
            </Link>
          </div>
        </header>
        {side === "employer" && roles.length > 0 && (
          <div className="flex items-center gap-2.5 border-b border-line bg-surface px-4 py-2 lg:hidden">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
              <Settings2 className="h-3 w-3" /> Hiring for
            </span>
            <div className="min-w-0 flex-1">
              <RoleSwitcher roles={roles} activeRoleId={activeRoleId} compact />
            </div>
          </div>
        )}
        <main className="mx-auto w-full max-w-[1120px] px-4 pb-44 pt-6 sm:px-6 lg:px-10 lg:pb-24 lg:pt-6">
          {children}
          <div className="mt-14 border-t border-line pt-5 lg:hidden">
            <AiStatusLine />
          </div>
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-line bg-paper/95 px-2 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
        aria-label="Mobile"
      >
        {navItems
          .filter((item) => item.href !== "/profile" && item.href !== "/invitations")
          .slice(0, 5)
          .map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} mobile />
          ))}
      </nav>
    </div>
  );
}
