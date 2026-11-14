import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProductLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/enter");

  const repo = getRepository();
  const [event, counts, roseState] = await Promise.all([
    repo.getEvent(),
    repo.getNavCounts(session.side, session.side === "candidate" ? session.candidate.id : session.employer.id),
    repo.getRoseState(session.side, session.side === "candidate" ? session.candidate.id : session.employer.id),
  ]);

  const roles = session.side === "employer" ? session.employer.roles.map((role) => ({ id: role.id, title: role.title })) : [];
  const activeRoleId = session.side === "employer" ? session.activeRole?.id ?? null : null;

  return (
    <AppShell
      side={session.side}
      name={session.side === "candidate" ? session.candidate.name : session.employer.name}
      headline={session.side === "candidate" ? session.candidate.headline : session.employer.tagline}
      monogram={
        session.side === "candidate"
          ? session.candidate.monogram
          : session.employer.name
              .split(/\s+/)
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
      }
      palette={session.side === "candidate" ? session.candidate.palette : session.employer.palette}
      eventName={event.name}
      eventDate={event.dateLabel}
      counts={counts}
      rosesRemaining={roseState.remaining}
      rosesTotal={roseState.total}
      roles={roles}
      activeRoleId={activeRoleId}
    >
      {children}
    </AppShell>
  );
}
