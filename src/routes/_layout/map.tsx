import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  APIProvider,
  Map as GoogleMap,
  Marker,
  useMap,
} from "@vis.gl/react-google-maps"
import { MessageCircle, RefreshCw, Send, X } from "lucide-react"
import { Fragment, useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import {
  type ChatHistoryPublic,
  type ChatMessagePublic,
  ChatService,
  type GatheringPublic,
  type GatheringRecommendPublic,
  GatheringsService,
  type UserLocationPublic,
  UsersService,
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
const LOCATION_MAP_KEY = ["location-map"] as const
const RECS_STORAGE_KEY = "chat-recommendations"
const LOCATION_STALE_MS = 5 * 60 * 1000

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
  const lastLocationSyncRef = useRef<number>(0)

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

  const locationMapQuery = useQuery({
    queryKey: LOCATION_MAP_KEY,
    queryFn: () => UsersService.getLocationMap(),
    staleTime: 30_000,
  })
  const friendLocations = (locationMapQuery.data?.friends ?? []).filter(
    (f): f is typeof f & { lat: number; lng: number } =>
      f.lat != null && f.lng != null,
  )

  const syncServerLocation = useCallback(
    async (loc: LatLng) => {
      try {
        await UsersService.updateUserLocation({
          requestBody: { lat: loc.lat, lng: loc.lng },
        })
        lastLocationSyncRef.current = Date.now()
        queryClient.invalidateQueries({ queryKey: LOCATION_MAP_KEY })
      } catch {
        // best-effort; chat still works against last-known server location
      }
    },
    [queryClient],
  )

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

  const getBrowserLocation = useCallback(
    (silent = false) =>
      new Promise<LatLng | null>((resolve) => {
        if (!navigator.geolocation) {
          if (!silent) {
            toast.error("Something went wrong!", {
              description: "이 브라우저는 위치 정보를 지원하지 않습니다.",
            })
          }
          resolve(null)
          return
        }
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          (err) => {
            if (!silent) {
              toast.error("Something went wrong!", {
                description: `위치를 가져오지 못했어요: ${err.message}`,
              })
            }
            resolve(null)
          },
          { enableHighAccuracy: true, timeout: 10000 },
        )
      }),
    [],
  )

  const fetchLocation = useCallback(async () => {
    setLoading(true)
    const loc = await getBrowserLocation()
    setLoading(false)
    if (!loc) return
    setPos(loc)
    await syncServerLocation(loc)
  }, [getBrowserLocation, syncServerLocation])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text) return
    setInput("")
    if (Date.now() - lastLocationSyncRef.current >= LOCATION_STALE_MS) {
      const loc = await getBrowserLocation(true)
      if (loc) {
        setPos(loc)
        await syncServerLocation(loc)
      }
    }
    sendMutation.mutate(text)
  }, [input, sendMutation, getBrowserLocation, syncServerLocation])

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
            <MapMarkers
              pos={pos}
              friends={friendLocations}
              events={events}
              onEventClick={setSelectedId}
            />
            <FitToUser pos={pos} />
          </GoogleMap>
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-3 right-3 z-10 rounded-full border border-[#b3b9c2]/40 bg-white/85 text-[#161b24] shadow-[0_4px_12px_-4px_rgba(0,0,0,0.15)] backdrop-blur-[8px] hover:bg-white"
            onClick={fetchLocation}
            disabled={loading}
            aria-label="현재 위치 새로고침"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} />
          </Button>
          {!chatOpen && (
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              aria-label="AI 챗봇 열기"
              className="absolute right-4 bottom-4 z-10 flex w-[130px] flex-col items-center rounded-[20px] border border-[#b3b9c2]/40 bg-white/86 px-2 pt-2 pb-1 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.2)] backdrop-blur-[12px] transition hover:bg-white"
            >
              <span className="flex items-center gap-1.5 font-['Stack_Sans_Headline'] text-[14px] font-medium text-[#161b24]">
                AI Coach
                <MessageCircle className="size-3.5 text-[#161b24]/70" />
              </span>
              <img
                src="/assets/images/ai-coach-avatar.png"
                alt="AI Coach"
                className="-mt-1 size-[110px] object-contain"
              />
            </button>
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
        <aside className="flex h-full w-1/3 shrink-0 flex-col border-l border-[#b3b9c2]/30 bg-[#f1f2f4]">
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#b3b9c2]/30 bg-white px-4">
            <span className="font-['Stack_Sans_Headline'] font-semibold text-[#44a16f]">
              AI Coach
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setChatOpen(false)}
              aria-label="챗봇 닫기"
              className="text-[#44a16f] hover:bg-[#44a16f]/10 hover:text-[#44a16f]"
            >
              <X />
            </Button>
          </div>
          <div className="flex-1 space-y-4 overflow-auto p-4">
            {chatHistoryQuery.isLoading ? (
              <p className="text-center text-sm text-[#979797]">불러오는 중…</p>
            ) : messages.length === 0 ? (
              <p className="text-center text-sm text-[#979797]">
                무엇이든 물어보세요.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-3 py-2">
                  <div className="h-px flex-1 bg-[#b3b9c2]/40" />
                  <span className="text-xs text-[#979797]">
                    Today,{" "}
                    {new Date().toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <div className="h-px flex-1 bg-[#b3b9c2]/40" />
                </div>
                {messages.map((m) => {
                  const recs = recommendationsByMsg[m.id]
                  const isUser = m.role === "user"
                  const time = m.created_at
                    ? new Date(m.created_at).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : ""
                  return (
                    <Fragment key={m.id}>
                      <div
                        className={cn(
                          "flex flex-col",
                          isUser ? "items-end" : "items-start",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                            isUser
                              ? "bg-[#5fc295] text-white"
                              : "bg-white text-[#161b24]",
                          )}
                        >
                          {m.message}
                        </div>
                        {time && (
                          <span className="mt-1 px-1 text-[11px] text-[#979797]">
                            {time}
                          </span>
                        )}
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
                })}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form
            className="flex shrink-0 items-center gap-2 border-t border-[#b3b9c2]/30 bg-white p-3"
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type Message..."
              aria-label="메시지 입력"
              disabled={sendMutation.isPending}
              className="h-11 rounded-full border-[#b3b9c2]/40 bg-[#f1f2f4] px-4 text-[#161b24] shadow-none placeholder:text-[#979797] focus-visible:border-[#44a16f] focus-visible:ring-[#44a16f]/30"
            />
            <button
              type="submit"
              disabled={!input.trim() || sendMutation.isPending}
              aria-label="전송"
              className="flex size-10 shrink-0 items-center justify-center text-[#161b24] transition hover:text-[#44a16f] disabled:opacity-40"
            >
              <Send className="size-5" />
            </button>
          </form>
        </aside>
      )}
    </div>
  )
}

type FriendLocation = UserLocationPublic & { lat: number; lng: number }

function MapMarkers({
  pos,
  friends,
  events,
  onEventClick,
}: {
  pos: LatLng | null
  friends: FriendLocation[]
  events: GatheringPublic[]
  onEventClick: (id: string) => void
}) {
  const map = useMap()
  if (!map) return null
  return (
    <>
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
      {friends.map((friend) => (
        <Marker
          key={friend.id}
          position={{ lat: friend.lat, lng: friend.lng }}
          title={friend.full_name ?? undefined}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#44a16f",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          }}
        />
      ))}
      {events.map((g) => (
        <Marker
          key={g.id}
          position={{ lat: g.lat, lng: g.lng }}
          title={g.title}
          icon={{
            path: "M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z",
            fillColor: "#F58F8F",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            scale: 1,
            anchor: new google.maps.Point(12, 36),
          }}
          onClick={() => onEventClick(g.id)}
        />
      ))}
    </>
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
