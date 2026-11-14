"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Briefcase,
  ClipboardCheck,
  Compass,
  Home,
  Info,
  LibraryBig,
  MessageCircle,
  SlidersHorizontal,
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
  /** Shown in the mobile bottom bar. At most five per side. */
  mobile?: boolean;
};

function isActive(pathname: string, href: string) {
  if (href === "/discover") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function TopNavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-14 shrink-0 items-center gap-1.5 px-2.5 text-[13px] font-medium transition xl:px-3",
        active ? "text-white" : "text-white/65 hover:text-white",
      )}
    >
      <span>{item.label}</span>
      {item.count ? (
        <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent-bright px-1 text-[11px] font-semibold text-navy">
          {item.count}
        </span>
      ) : null}
      {active ? <span className="absolute inset-x-2.5 bottom-0 h-[3px] rounded-t bg-accent-bright xl:inset-x-3" aria-hidden /> : null}
    </Link>
  );
}

function MobileNavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const active = isActive(pathname, item.href);
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
          { href: "/dashboard", label: "Dashboard", shortLabel: "Home", icon: Home, mobile: true },
          { href: "/learn", label: "Prepare", shortLabel: "Prepare", icon: BookOpen, mobile: true },
          { href: "/assessments", label: "Assessments", shortLabel: "Tests", icon: ClipboardCheck, mobile: true },
          { href: "/discover", label: "Jobs", shortLabel: "Jobs", icon: Briefcase, mobile: true },
          { href: "/matches", label: "Matches", shortLabel: "Matches", icon: MessageCircle, count: counts.matches, mobile: true },
          {
            href: "/priority-intros",
            label: PRIORITY_INTRO.navLabel,
            shortLabel: PRIORITY_INTRO.shortLabel,
            icon: PriorityIntroIcon,
            count: counts.priorityIntrosReceived,
          },
          { href: "/invitations", label: "Invitations", shortLabel: "Invites", icon: Users, count: counts.invitations },
        ]
      : [
          { href: "/dashboard", label: "Dashboard", shortLabel: "Home", icon: Home, mobile: true },
          { href: "/discover", label: "Review", shortLabel: "Review", icon: Compass, mobile: true },
          { href: "/discovery", label: "Discovery", shortLabel: "Discover", icon: Users, mobile: true },
          { href: "/roles", label: "Role cards", shortLabel: "Roles", icon: SlidersHorizontal, mobile: true },
          { href: "/assessments", label: "Test library", shortLabel: "Library", icon: LibraryBig },
          { href: "/matches", label: "Matches", shortLabel: "Matches", icon: MessageCircle, count: counts.matches, mobile: true },
          {
            href: "/priority-intros",
            label: PRIORITY_INTRO.navLabel,
            shortLabel: PRIORITY_INTRO.shortLabel,
            icon: PriorityIntroIcon,
            count: counts.priorityIntrosReceived,
          },
        ];

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 bg-navy text-white">
        <div className="mx-auto flex h-14 w-full max-w-[1180px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" aria-label="Rivet home" className="shrink-0">
            <Logo light compact className="sm:hidden" />
            <Logo light className="hidden sm:inline-flex" />
          </Link>
          <nav className="hidden min-w-0 flex-1 items-center overflow-x-auto no-scrollbar lg:flex" aria-label="Main">
            {navItems.map((item) => (
              <TopNavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <Link
              href="/how-it-works"
              aria-label="How Rivet works"
              className="flex h-9 w-9 items-center justify-center rounded-md text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <Info className="h-4 w-4" />
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-md py-1 pl-1 pr-1 transition hover:bg-white/10 sm:pr-2.5"
              aria-label={"Your profile: " + name}
            >
              <Avatar name={name} monogram={monogram} palette={palette} size="xs" square={side === "employer"} />
              <span className="hidden max-w-[140px] truncate text-[12px] font-medium text-white/90 xl:inline">{name}</span>
            </Link>
            <Link
              href="/enter"
              className="hidden h-9 items-center rounded-md px-2.5 text-[12px] font-medium text-white/65 transition hover:bg-white/10 hover:text-white md:inline-flex"
            >
              Switch account
            </Link>
          </div>
        </div>
      </header>

      {side === "employer" && roles.length > 0 && (
        <div className="border-b border-line bg-surface">
          <div className="mx-auto flex w-full max-w-[1180px] items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
            <span className="shrink-0 text-[12px] font-semibold text-ink-muted">Hiring for</span>
            <div className="min-w-0 max-w-sm flex-1">
              <RoleSwitcher roles={roles} activeRoleId={activeRoleId} compact />
            </div>
            <p className="ml-auto hidden truncate text-[12px] text-ink-faint md:block">{headline}</p>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1180px] px-4 pb-44 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-8">
        {children}
        <footer className="mt-16 flex flex-col gap-3 border-t border-line pt-5 text-[12px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <AiStatusLine />
          <p>
            {eventName}. Every person, team and score is fictional.{" "}
            <Link href="/" className="font-medium text-ink-muted hover:text-ink">
              About the concept
            </Link>
          </p>
        </footer>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-line bg-surface/95 px-2 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
        aria-label="Mobile"
      >
        {navItems
          .filter((item) => item.mobile)
          .slice(0, 5)
          .map((item) => (
            <MobileNavLink key={item.href} item={item} pathname={pathname} />
          ))}
      </nav>
    </div>
  );
}
