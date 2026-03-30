import { create } from "zustand";

import type { ChatHistoryEntry, TraceStep } from "@/lib/types";

function newMessageId(): string {
  return `msg-${globalThis.crypto.randomUUID()}`;
}

export type ChatStore = {
  messages: ChatHistoryEntry[];
  traceSteps: TraceStep[];
  isProcessing: boolean;
  addMessage: (entry: Pick<ChatHistoryEntry, "role" | "text">) => void;
  upsertTraceStep: (step: TraceStep) => void;
  clearTrace: () => void;
  setProcessing: (value: boolean) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  traceSteps: [],
  isProcessing: false,

  addMessage: (entry) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: newMessageId(),
          role: entry.role,
          text: entry.text,
          timestamp: new Date().toISOString(),
        },
      ],
    })),

  upsertTraceStep: (st) =>
    set((s) => {
      const idx = s.traceSteps.findIndex((x) => x.id === st.id);
      if (idx === -1) {
        return { traceSteps: [...s.traceSteps, st] };
      }
      const next = [...s.traceSteps];
      next[idx] = st;
      return { traceSteps: next };
    }),

  clearTrace: () => set({ traceSteps: [] }),

  setProcessing: (value) => set({ isProcessing: value }),
}));
