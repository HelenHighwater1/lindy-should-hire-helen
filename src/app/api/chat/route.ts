import { NextResponse } from "next/server";
import { initialWorkspaceData } from "@/lib/data/seed";
import { ProcessChatError, processChat } from "@/server/llm";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as { text?: unknown }).text !== "string"
  ) {
    return NextResponse.json(
      { error: 'Expected JSON object with a string "text" field' },
      { status: 400 },
    );
  }

  const text = (body as { text: string }).text.trim();
  if (text === "") {
    return NextResponse.json(
      { error: '"text" must be a non-empty string' },
      { status: 400 },
    );
  }

  try {
    const result = await processChat(text, initialWorkspaceData);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ProcessChatError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 },
    );
  }
}
