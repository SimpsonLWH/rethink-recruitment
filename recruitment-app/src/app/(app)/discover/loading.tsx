export default function DiscoverLoading() {
  return (
    <div className="mx-auto w-full max-w-[920px]" aria-hidden data-testid="discover-loading">
      <div className="h-3 w-24 rounded-full bg-line" />
      <div className="mt-3 h-9 w-[min(20rem,80%)] rounded-lg bg-line" />
      <div className="mt-3 h-3 w-[min(34rem,100%)] rounded-full bg-line" />
      <div className="mt-2 h-3 w-[min(26rem,80%)] rounded-full bg-line" />

      <div className="mt-8 overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-line" />
            <div className="space-y-2">
              <div className="h-3 w-32 rounded-full bg-line" />
              <div className="h-3 w-48 rounded-full bg-line" />
            </div>
          </div>
          <div className="h-3 w-16 rounded-full bg-line" />
        </div>
        <div className="grid gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_290px] lg:gap-8">
          <div>
            <div className="h-2.5 w-16 rounded-full bg-line" />
            <div className="mt-3 h-9 w-[min(16rem,70%)] rounded-lg bg-line" />
            <div className="mt-4 h-3 w-full rounded-full bg-line" />
            <div className="mt-2 h-3 w-[85%] rounded-full bg-line" />
            <div className="mt-2 h-3 w-[60%] rounded-full bg-line" />
            <div className="mt-4 flex gap-1.5">
              <div className="h-5 w-20 rounded bg-line" />
              <div className="h-5 w-16 rounded bg-line" />
              <div className="h-5 w-24 rounded bg-line" />
            </div>
          </div>
          <div className="border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div className="flex items-center justify-between">
              <div className="h-2.5 w-20 rounded-full bg-line" />
              <div className="h-2.5 w-14 rounded-full bg-line" />
            </div>
            <div className="mt-3 h-11 w-full rounded-full bg-line" />
            <div className="mt-5 h-2.5 w-28 rounded-full bg-line" />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full rounded-full bg-line" />
              <div className="h-3 w-[80%] rounded-full bg-line" />
              <div className="h-3 w-[70%] rounded-full bg-line" />
            </div>
          </div>
        </div>
        <div className="hidden flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-6 lg:flex">
          <div className="h-3 w-40 rounded-full bg-line" />
          <div className="h-3 w-24 rounded-full bg-line" />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        <div className="h-10 w-24 rounded-full bg-line" />
        <div className="h-10 w-32 rounded-full bg-line" />
        <div className="h-10 w-40 rounded-full bg-line" />
      </div>
    </div>
  );
}
