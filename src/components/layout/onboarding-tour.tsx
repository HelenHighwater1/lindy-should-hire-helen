"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface TourStep {
  title: string;
  body: string;
  panel: "left" | "center" | "right" | null;
}

const STEPS: TourStep[] = [
  {
    title: "Welcome, Lindy Team, to my demo app!",
    body: "This demo shows an AI assistant that manages a simulated workspace - calendar, email, and contacts - all in real time. Let me give you a quick tour.",
    panel: null,
  },
  {
    title: "Your Workspace",
    body: "On the left is a simulated workspace with your calendar, emails, and contacts. Watch it update live as the assistant takes action on your behalf.",
    panel: "left",
  },
  {
    title: "Chat with the Assistant",
    body: "In the center, type natural-language requests like scheduling meetings or summarizing emails. The assistant will handle it.",
    panel: "center",
  },
  {
    title: "Agent Trace",
    body: "On the right you can see each step the agent takes in real time - thinking, tool calls, and results - so you know exactly how it works.",
    panel: "right",
  },
  {
    title: "Try it out!",
    body: "Type something like \"Schedule a 30-min sync with Jordan tomorrow at 3 pm\" and watch the workspace update.",
    panel: null,
  },
];

const STORAGE_KEY = "lindy-tour-complete";

export function OnboardingTour() {
  const [step, setStep] = useState<number | null>(null);
  const [glowRect, setGlowRect] = useState<DOMRect | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    setStep(0);
  }, []);

  useEffect(() => {
    if (step === null) {
      setGlowRect(null);
      return;
    }
    const panel = STEPS[step].panel;
    if (!panel) {
      setGlowRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour-panel="${panel}"]`);
    if (!el) {
      setGlowRect(null);
      return;
    }

    const update = () => {
      setGlowRect(el.getBoundingClientRect());
      rafRef.current = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(rafRef.current);
  }, [step]);

  const finish = useCallback(() => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setStep(null);
  }, []);

  if (step === null) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" />

      {glowRect && (
        <div
          className="pointer-events-none fixed z-50 rounded-xl transition-all duration-300"
          style={{
            top: glowRect.top - 4,
            left: glowRect.left - 4,
            width: glowRect.width + 8,
            height: glowRect.height + 8,
            boxShadow:
              "0 0 0 2px rgba(255,255,255,0.15), 0 0 30px 8px rgba(56,189,248,0.25), 0 0 60px 16px rgba(56,189,248,0.1)",
          }}
        />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="flex h-[220px] w-full max-w-md flex-col rounded-xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= step ? "bg-sky-500" : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                />
              ))}
            </div>
            <h2 className="mt-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {current.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {current.body}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={finish}
              className="text-xs text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
            >
              Skip
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s ?? 1) - 1)}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={isLast ? finish : () => setStep((s) => (s ?? 0) + 1)}
                className="rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-600"
              >
                {isLast ? "Get started" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
