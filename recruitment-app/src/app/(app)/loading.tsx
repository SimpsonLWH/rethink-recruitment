import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="hidden h-10 w-28 sm:block" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_310px]">
        <Skeleton className="h-[560px] rounded-[28px]" />
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-[24px]" />
          <Skeleton className="h-60 rounded-[24px]" />
        </div>
      </div>
    </div>
  );
}
