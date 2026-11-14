"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { switchEmployerRole } from "@/app/actions/session";
import { cn } from "@/lib/utils";

export function RoleSwitcher({
  roles,
  activeRoleId,
  compact = false,
}: {
  roles: Array<{ id: string; title: string }>;
  activeRoleId: string | null;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);

  if (roles.length === 0) return null;

  return (
    <form ref={formRef} action={switchEmployerRole} className={cn("relative", compact ? "w-full" : "")}>
      <input type="hidden" name="next" value={pathname} />
      <label className={cn("mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.13em] text-ink-faint", compact && "sr-only")}>
        Viewing as
      </label>
      <div className="relative">
        <select
          name="roleId"
          defaultValue={activeRoleId ?? roles[0]?.id}
          onChange={() => formRef.current?.requestSubmit()}
          aria-label="Active hiring role"
          className={cn(
            "w-full appearance-none rounded-xl border border-line bg-surface py-2.5 pl-3 pr-8 text-[12px] font-medium text-ink outline-none transition focus:border-rose/50 focus:ring-2 focus:ring-rose/10",
            compact ? "h-9 py-1 text-[11px]" : "h-10",
          )}
        >
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.title}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
      </div>
    </form>
  );
}
