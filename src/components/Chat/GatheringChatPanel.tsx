import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
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

  return (
    <div className="flex h-full min-h-0 flex-col rounded-md border bg-card">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          참가자 채팅
        </span>
        <ChatStatusBadge status={status} />
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 space-y-2 overflow-y-auto px-3 py-3"
      >
        {messages.length === 0 ? (
          <p className="pt-6 text-center text-xs text-muted-foreground">
            {status === "open"
              ? "아직 메시지가 없어요. 인사를 건네보세요!"
              : "연결되면 대화를 시작할 수 있어요."}
          </p>
        ) : (
          messages.map((m, i) => (
            <MessageBubble
              key={`${m.sent_at}-${m.user_id}-${i}`}
              message={m}
              isMine={!!user && user.id === m.user_id}
            />
          ))
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t p-2"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={status === "open" ? "메시지를 입력하세요" : "연결 중…"}
          disabled={status !== "open"}
          maxLength={500}
        />
        <Button type="submit" size="sm" disabled={!canSend}>
          전송
        </Button>
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
      ? "text-emerald-500"
      : status === "connecting"
        ? "text-amber-500"
        : status === "error"
          ? "text-destructive"
          : "text-muted-foreground"

  return <span className={cn("text-[11px]", cls)}>{label}</span>
}

function MessageBubble({
  message,
  isMine,
}: {
  message: GatheringChatMessage
  isMine: boolean
}) {
  const time = new Date(message.sent_at).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div
      className={cn(
        "flex flex-col gap-0.5",
        isMine ? "items-end" : "items-start",
      )}
    >
      {!isMine && (
        <span className="px-1 text-[11px] text-muted-foreground">
          {message.user_name}
        </span>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-1.5 text-sm",
          isMine
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.message}</p>
      </div>
      <span className="px-1 text-[10px] text-muted-foreground">{time}</span>
    </div>
  )
}

export default GatheringChatPanel
