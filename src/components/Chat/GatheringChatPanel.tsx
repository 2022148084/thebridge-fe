import { Send } from "lucide-react"
import { Fragment, useEffect, useMemo, useRef, useState } from "react"

import { Input } from "@/components/ui/input"
import useAuth from "@/hooks/useAuth"
import {
  type GatheringChatMessage,
  type GatheringChatStatus,
  useGatheringChat,
} from "@/hooks/useGatheringChat"
import { cn } from "@/lib/utils"

interface GatheringChatPanelProps {
  gatheringId: string
  enabled: boolean
}

export function GatheringChatPanel({
  gatheringId,
  enabled,
}: GatheringChatPanelProps) {
  const { user } = useAuth()
  const { messages, status, send } = useGatheringChat({
    gatheringId,
    enabled,
  })
  const [draft, setDraft] = useState("")
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (messages.length === 0) return
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    if (send(text)) setDraft("")
  }

  const canSend = status === "open" && draft.trim().length > 0

  const daySeparatorText = useMemo(() => {
    if (messages.length === 0) return null
    const first = new Date(messages[0].sent_at)
    return `Today, ${first.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    })}`
  }, [messages])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-[#f1f2f4]">
      <div className="flex items-center justify-between bg-white px-3 py-2">
        <span className="text-xs font-semibold text-[#44a16f]">
          참가자 채팅
        </span>
        <ChatStatusBadge status={status} />
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 space-y-3 overflow-y-auto px-3 py-3"
      >
        {messages.length === 0 ? (
          <p className="pt-6 text-center text-xs text-[#979797]">
            {status === "open"
              ? "아직 메시지가 없어요. 인사를 건네보세요!"
              : "연결되면 대화를 시작할 수 있어요."}
          </p>
        ) : (
          <>
            {daySeparatorText && (
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-[#b3b9c2]/40" />
                <span className="text-xs text-[#979797]">
                  {daySeparatorText}
                </span>
                <div className="h-px flex-1 bg-[#b3b9c2]/40" />
              </div>
            )}
            {messages.map((m, i) => (
              <MessageBubble
                key={`${m.sent_at}-${m.user_id}-${i}`}
                message={m}
                isMine={!!user && user.id === m.user_id}
              />
            ))}
          </>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 bg-white p-3"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={status === "open" ? "Type Message..." : "연결 중…"}
          disabled={status !== "open"}
          maxLength={500}
          className="h-11 rounded-full border-[#b3b9c2]/40 bg-[#f1f2f4] px-4 text-[#161b24] shadow-none placeholder:text-[#979797] focus-visible:border-[#44a16f] focus-visible:ring-[#44a16f]/30"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="전송"
          className="flex size-10 shrink-0 items-center justify-center text-[#161b24] transition hover:text-[#44a16f] disabled:opacity-40"
        >
          <Send className="size-5" />
        </button>
      </form>
    </div>
  )
}

function ChatStatusBadge({ status }: { status: GatheringChatStatus }) {
  const label =
    status === "open"
      ? "● 연결됨"
      : status === "connecting"
        ? "연결 중…"
        : status === "error"
          ? "연결 오류"
          : status === "closed"
            ? "연결 종료"
            : "대기 중"

  const cls =
    status === "open"
      ? "text-[#44a16f]"
      : status === "connecting"
        ? "text-amber-500"
        : status === "error"
          ? "text-destructive"
          : "text-[#979797]"

  return <span className={cn("text-[11px]", cls)}>{label}</span>
}

function MessageBubble({
  message,
  isMine,
}: {
  message: GatheringChatMessage
  isMine: boolean
}) {
  const time = new Date(message.sent_at).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })

  return (
    <Fragment>
      <div
        className={cn("flex flex-col", isMine ? "items-end" : "items-start")}
      >
        {!isMine && (
          <span className="mb-0.5 px-1 text-[11px] text-[#979797]">
            {message.user_name}
          </span>
        )}
        <div
          className={cn(
            "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
            isMine ? "bg-[#5fc295] text-white" : "bg-white text-[#161b24]",
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.message}</p>
        </div>
        <span className="mt-1 px-1 text-[11px] text-[#979797]">{time}</span>
      </div>
    </Fragment>
  )
}

export default GatheringChatPanel
