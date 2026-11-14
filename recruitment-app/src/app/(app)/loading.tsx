export default function AppLoading() {
  return (
    <div className="mx-auto max-w-[920px] py-2">
      <div className="h-3 w-24 rounded-full bg-line" />
      <div className="mt-3 h-9 w-[min(20rem,80%)] rounded-lg bg-line" />
      <div className="mt-3 h-3 w-[min(30rem,70%)] rounded-full bg-line" />
      <div className="mt-8 h-[440px] rounded-xl border border-line bg-surface p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-line" />
          <div className="space-y-2">
            <div className="h-6 w-48 rounded bg-line" />
            <div className="h-3 w-32 rounded bg-line" />
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="h-32 rounded-xl bg-line/70" />
          <div className="h-32 rounded-xl bg-line/70" />
          <div className="h-24 rounded-xl bg-line/70" />
          <div className="h-24 rounded-xl bg-line/70" />
        </div>
      </div>
    </div>
  );
}