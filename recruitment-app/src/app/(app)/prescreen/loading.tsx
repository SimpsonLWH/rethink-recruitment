import { Skeleton } from "@/components/ui/skeleton";

export default function PrescreenLoading() {
  return (
    <div className="animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <Skeleton className="mt-6 h-[132px] w-full rounded-xl" />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[86px] w-full rounded-xl" />
        ))}
      </div>
      <div className="mt-8 space-y-3">
        <Skeleton className="h-6 w-48" />
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-[112px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
