import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  APIProvider,
  Map as GoogleMap,
  Marker,
  useMap,
} from "@vis.gl/react-google-maps"
import { RefreshCw, Send, Sparkles, X } from "lucide-react"
import { Fragment, useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import {
  type ChatHistoryPublic,
  type ChatMessagePublic,
  ChatService,
  type GatheringRecommendPublic,
  GatheringsService,
} from "@/client"
import GatheringRecommendCard from "@/components/Chat/GatheringRecommendCard"
import GatheringDetailDialog from "@/components/Events/GatheringDetailDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useJoinedGatherings } from "@/lib/joinedGatherings"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_layout/map")({
  component: MapPage,
  head: () => ({
    meta: [
      {
        title: "Map - Hackathon Template",
      },
    ],
  }),
})

const SEOUL = { lat: 37.5665, lng: 126.978 }

type LatLng = { lat: number; lng: number }

const CHAT_HISTORY_KEY = ["chat-history"] as const
const RECS_STORAGE_KEY = "chat-recommendations"

function loadRecsFromStorage(): Record<string, GatheringRecommendPublic[]> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(RECS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function MapPage() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const queryClient = useQueryClient()
  const [pos, setPos] = useState<LatLng | null>(null)
  const [loading, setLoading] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [input, setInput] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [recommendationsByMsg, setRecommendationsByMsg] =
    useState<Record<string, GatheringRecommendPublic[]>>(loadRecsFromStorage)
  const { has: hasJoined, markJoined, markUnjoined } = useJoinedGatherings()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      window.localStorage.setItem(
        RECS_STORAGE_KEY,
        JSON.stringify(recommendationsByMsg),
      )
    } catch {
      // storage may be unavailable (private mode, quota); silently skip
    }
  }, [recommendationsByMsg])

  const { data: gatheringsData } = useQuery({
    queryKey: ["gatherings"],
    queryFn: () => GatheringsService.readGatherings(),
  })
  const events = gatheringsData?.data ?? []

  const chatHistoryQuery = useQuery({
    queryKey: CHAT_HISTORY_KEY,
    queryFn: () => ChatService.getChatHistory(),
  })
  const cutoff =
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem("chat-cutoff")
  const messages = (chatHistoryQuery.data?.data ?? []).filter((m) => {
    if (!cutoff) return true
    if (!m.created_at) return true
    return m.created_at >= cutoff
  })

  const sendMutation = useMutation({
    mutationFn: (message: string) =>
      ChatService.sendMessage({ requestBody: { message } }),
    onMutate: async (message) => {
      await queryClient.cancelQueries({ queryKey: CHAT_HISTORY_KEY })
      const previous =
        queryClient.getQueryData<ChatHistoryPublic>(CHAT_HISTORY_KEY)
      const optimistic: ChatMessagePublic = {
        id: `temp-${Date.now()}`,
        role: "user",
        message,
        created_at: new Date().toISOString(),
      }
      queryClient.setQueryData<ChatHistoryPublic>(CHAT_HISTORY_KEY, (old) => ({
        data: [...(old?.data ?? []), optimistic],
      }))
      return { previous }
    },
    onSuccess: (response) => {
      if (response.recommendations && response.recommendations.length > 0) {
        setRecommendationsByMsg((prev) => ({
          ...prev,
          [response.message.id]: response.recommendations ?? [],
        }))
      }
    },
    onError: (_err, _msg, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(CHAT_HISTORY_KEY, ctx.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_HISTORY_KEY })
    },
    meta: { errorMessage: "메시지 전송에 실패했어요" },
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to bottom whenever a new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  const sendMessage = useCallback(() => {
    const text = input.trim()
    if (!text) return
    sendMutation.mutate(text)
    setInput("")
  }, [input, sendMutation])

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Something went wrong!", {
        description: "이 브라우저는 위치 정보를 지원하지 않습니다.",
      })
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude })
        setLoading(false)
      },
      (err) => {
        toast.error("Something went wrong!", {
          description: `위치를 가져오지 못했어요: ${err.message}`,
        })
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  useEffect(() => {
    fetchLocation()
  }, [fetchLocation])

  if (!apiKey) {
    return (
      <div>
        <h1 className="text-2xl">Map</h1>
        <p className="text-muted-foreground mt-2">
          VITE_GOOGLE_MAPS_API_KEY 환경변수를 설정해 주세요.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="relative h-full flex-1">
        <APIProvider apiKey={apiKey}>
          <GoogleMap
            defaultCenter={SEOUL}
            defaultZoom={12}
            gestureHandling="greedy"
            disableDefaultUI={false}
            streetViewControl={false}
            fullscreenControl={false}
            mapTypeControl={false}
            rotateControl={false}
            cameraControl={false}
            isFractionalZoomEnabled
            styles={[{ featureType: "poi", stylers: [{ visibility: "off" }] }]}
          >
            {pos && (
              <Marker
                position={pos}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: "#4285F4",
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeWeight: 2,
                }}
              />
            )}
            {events.map((g) => (
              <Marker
                key={g.id}
                position={{ lat: g.lat, lng: g.lng }}
                title={g.title}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: "#EF4444",
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeWeight: 2,
                }}
                onClick={() => setSelectedId(g.id)}
              />
            ))}
            <FitToUser pos={pos} />
          </GoogleMap>
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-3 right-3 z-10 shadow-md"
            onClick={fetchLocation}
            disabled={loading}
            aria-label="현재 위치 새로고침"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} />
          </Button>
          {!chatOpen && (
            <Button
              size="icon"
              className="absolute right-4 bottom-4 z-10 h-14 w-14 rounded-full shadow-lg"
              onClick={() => setChatOpen(true)}
              aria-label="AI 챗봇 열기"
            >
              <Sparkles className="size-6" />
            </Button>
          )}
        </APIProvider>
        <GatheringDetailDialog
          gatheringId={selectedId}
          joined={selectedId !== null && hasJoined(selectedId)}
          onOpenChange={(open) => {
            if (!open) setSelectedId(null)
          }}
          onJoinedChange={(g, joined) => {
            if (joined) markJoined(g)
            else markUnjoined(g.id)
          }}
        />
      </div>
      {chatOpen && (
        <aside className="flex h-full w-1/3 shrink-0 flex-col border-l bg-background">
          <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
            <span className="font-semibold">AI Chat</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setChatOpen(false)}
              aria-label="챗봇 닫기"
            >
              <X />
            </Button>
          </div>
          <div className="flex-1 space-y-3 overflow-auto p-4">
            {chatHistoryQuery.isLoading ? (
              <p className="text-muted-foreground text-sm">불러오는 중…</p>
            ) : messages.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                무엇이든 물어보세요.
              </p>
            ) : (
              messages.map((m) => {
                const recs = recommendationsByMsg[m.id]
                return (
                  <Fragment key={m.id}>
                    <div
                      className={cn(
                        "flex",
                        m.role === "user" ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted",
                        )}
                      >
                        {m.message}
                      </div>
                    </div>
                    {recs && recs.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {recs.map((rec) => (
                          <GatheringRecommendCard
                            key={rec.id}
                            gathering={rec}
                            joined={hasJoined(rec.id)}
                            onSelect={setSelectedId}
                            onJoined={markJoined}
                          />
                        ))}
                      </div>
                    )}
                  </Fragment>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          <form
            className="flex shrink-0 items-center gap-2 border-t p-3"
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요"
              aria-label="메시지 입력"
              disabled={sendMutation.isPending}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || sendMutation.isPending}
              aria-label="전송"
            >
              <Send />
            </Button>
          </form>
        </aside>
      )}
    </div>
  )
}

const VIEW_RADIUS_M = 3000

function FitToUser({ pos }: { pos: LatLng | null }) {
  const map = useMap()
  const hasFitInitial = useRef(false)
  useEffect(() => {
    if (!pos || !map) return
    if (hasFitInitial.current) {
      map.panTo(pos)
      return
    }
    hasFitInitial.current = true
    const doFit = () => {
      const div = map.getDiv()
      const longerPx = Math.max(div.offsetWidth, div.offsetHeight)
      if (!longerPx) return
      const earthAtLat = 40075016.686 * Math.cos((pos.lat * Math.PI) / 180)
      const zoom = Math.log2((earthAtLat * longerPx) / (512 * VIEW_RADIUS_M))
      map.setCenter(pos)
      map.setZoom(zoom)
    }
    if (map.getBounds()) {
      doFit()
    } else {
      google.maps.event.addListenerOnce(map, "idle", doFit)
    }
  }, [pos, map])
  return null
}
