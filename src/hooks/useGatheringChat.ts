import { useCallback, useEffect, useRef, useState } from "react"

export interface GatheringChatMessage {
  type: "message"
  room_id: string
  user_id: string
  user_name: string
  message: string
  sent_at: string
}

export type GatheringChatStatus =
  | "idle"
  | "connecting"
  | "open"
  | "closed"
  | "error"

interface UseGatheringChatOptions {
  gatheringId: string | null
  enabled: boolean
}

export function useGatheringChat({
  gatheringId,
  enabled,
}: UseGatheringChatOptions) {
  const [messages, setMessages] = useState<GatheringChatMessage[]>([])
  const [status, setStatus] = useState<GatheringChatStatus>("idle")
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    setMessages([])
    if (!enabled || !gatheringId) {
      setStatus("idle")
      return
    }
    const token = localStorage.getItem("access_token")
    if (!token) {
      setStatus("error")
      return
    }

    const apiBase = import.meta.env.VITE_API_URL as string
    const wsBase = apiBase.replace(/^http/i, "ws")
    const url = `${wsBase}/api/v1/chat/ws/gatherings/${gatheringId}?token=${encodeURIComponent(token)}`

    setStatus("connecting")
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => setStatus("open")
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data?.type === "message") {
          setMessages((prev) => [...prev, data as GatheringChatMessage])
        }
      } catch {
        // ignore malformed payloads
      }
    }
    ws.onerror = () => setStatus("error")
    ws.onclose = () => {
      setStatus((prev) => (prev === "error" ? "error" : "closed"))
      if (wsRef.current === ws) wsRef.current = null
    }

    return () => {
      ws.close()
      if (wsRef.current === ws) wsRef.current = null
    }
  }, [gatheringId, enabled])

  const send = useCallback((message: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return false
    ws.send(JSON.stringify({ message }))
    return true
  }, [])

  return { messages, status, send }
}

export default useGatheringChat
