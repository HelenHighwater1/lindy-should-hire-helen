import { AppShell } from "@/components/layout/app-shell";
import { OnboardingTour } from "@/components/layout/onboarding-tour";

export default function Home() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between px-1 py-2.5">
        <span className="font-mono text-sm tracking-tight text-zinc-400">
          Built for{" "}
          <span className="font-semibold text-sky-400">Lindy</span>
          {" "}by Helen
        </span>
        <a
          href="https://github.com/HelenHighwater1/lindy-should-hire-helen?tab=readme-ov-file#hey-lindy-team"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/50 px-3 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          View Repo
        </a>
      </header>
      <main className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-zinc-700/80 shadow-lg shadow-black/20">
        <AppShell />
      </main>
      <footer className="flex shrink-0 items-center justify-center py-2 text-[11px] text-zinc-500">
        <a
          href="https://heyimhelen.com"
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-zinc-300"
        >
          Made by Helen Highwater
        </a>
      </footer>
      <OnboardingTour />
    </div>
  );
}
