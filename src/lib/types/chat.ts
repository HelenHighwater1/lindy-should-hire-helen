export interface ChatHistoryEntry {
  id: string;
  role: "user" | "assistant" | "error";
  text: string;
  timestamp: string;
}
