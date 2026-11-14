import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-paper">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-6 lg:px-8">
        <Link href="/" aria-label="Rivet">
          <Logo />
        </Link>
        <Link href="/how-it-works" className="text-[13px] font-medium text-ink-muted transition hover:text-ink">
          How it works
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-5 py-16 lg:px-8">
        <p className="text-[12px] font-medium text-ink-muted">404</p>
        <h1 className="mt-3 max-w-xl font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.02] tracking-[-0.04em]">
          This page does not exist.
        </h1>
        <p className="mt-4 max-w-md text-[14px] leading-6 text-ink-muted">
          The link may be from an old demo run. Everything in this prototype is synthetic, so nothing was lost.
        </p>
        <div className="mt-7 flex flex-wrap gap-2">
          <Link
            href="/enter"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-[13px] font-medium text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-[13px] font-medium text-ink"
          >
            <Compass className="h-4 w-4" /> Back to the concept
          </Link>
        </div>
      </div>
    </main>
  );
}
