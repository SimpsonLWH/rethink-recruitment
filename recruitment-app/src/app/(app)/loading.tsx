export default function AppLoading() {
  return (
    <div className="mx-auto max-w-3xl py-10">
      <div className="h-3 w-32 rounded-full bg-line" />
      <div className="mt-4 h-12 w-2/3 rounded-xl bg-line" />
      <div className="mt-3 h-4 w-1/2 rounded-full bg-line" />
      <div className="mt-10 h-[520px] rounded-[24px] border border-line bg-surface p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-line" />
          <div className="space-y-2">
            <div className="h-6 w-48 rounded bg-line" />
            <div className="h-3 w-32 rounded bg-line" />
          </div>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="h-36 rounded-2xl bg-line/70" />
          <div className="h-36 rounded-2xl bg-line/70" />
          <div className="h-28 rounded-2xl bg-line/70" />
          <div className="h-28 rounded-2xl bg-line/70" />
        </div>
      </div>
    </div>
  );
}
