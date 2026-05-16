export type ChatMessage = {
  id: number
  role: "user" | "assistant"
  content: string
}

const STORAGE_KEY = "chat:messages:v1"
const MAX_MESSAGES = 100

export function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (m): m is ChatMessage =>
        typeof m?.id === "number" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string",
    )
  } catch {
    return []
  }
}

export function saveMessages(messages: ChatMessage[]): void {
  try {
    const capped =
      messages.length > MAX_MESSAGES
        ? messages.slice(messages.length - MAX_MESSAGES)
        : messages
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capped))
  } catch {
    // quota exceeded or storage disabled — fail silently
  }
}

export function clearMessages(): void {
  localStorage.removeItem(STORAGE_KEY)
}
