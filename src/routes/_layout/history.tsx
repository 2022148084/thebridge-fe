import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  CalendarDays,
  History as HistoryIcon,
  MapPin,
  Trash2,
  Users,
} from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { type GatheringPublic, GatheringsService } from "@/client"
import {
  SPORT_LABELS,
  type SportType,
} from "@/components/Events/CreateEventDialog"
import GatheringDetailDialog from "@/components/Events/GatheringDetailDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoadingButton } from "@/components/ui/loading-button"
import useAuth from "@/hooks/useAuth"
import {
  type JoinedGathering,
  useJoinedGatherings,
} from "@/lib/joinedGatherings"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_layout/history")({
  component: HistoryPage,
  head: () => ({
    meta: [
      {
        title: "History - Hackathon Template",
      },
    ],
  }),
})

type Role = "host" | "participant"
type HostItem = { role: "host"; gathering: GatheringPublic }
type ParticipantItem = { role: "participant"; gathering: JoinedGathering }
type Item = HostItem | ParticipantItem

function HistoryPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [pendingDelete, setPendingDelete] = useState<GatheringPublic | null>(
    null,
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const {
    items: joinedMap,
    add: addJoined,
    remove: removeJoined,
    has: hasJoined,
  } = useJoinedGatherings()

  const gatheringsQuery = useQuery({
    queryKey: ["gatherings"],
    queryFn: () => GatheringsService.readGatherings(),
  })

  const items: Item[] = useMemo(() => {
    if (!user) return []
    const all = gatheringsQuery.data?.data ?? []
    const hosted: HostItem[] = all
      .filter((g) => g.host_id === user.id)
      .map((g) => ({ role: "host", gathering: g }))
    const hostedIds = new Set(hosted.map((h) => h.gathering.id))
    const participated: ParticipantItem[] = Object.values(joinedMap)
      .filter((g) => !hostedIds.has(g.id))
      .map((g) => ({ role: "participant", gathering: g }))
    return [...hosted, ...participated].sort(
      (a, b) =>
        new Date(b.gathering.starts_at).getTime() -
        new Date(a.gathering.starts_at).getTime(),
    )
  }, [gatheringsQuery.data, user, joinedMap])

  const deleteMutation = useMutation({
    mutationFn: (id: string) => GatheringsService.deleteGathering({ id }),
    onSuccess: () => {
      toast.success("모임이 삭제되었어요")
      queryClient.invalidateQueries({ queryKey: ["gatherings"] })
      setPendingDelete(null)
    },
    meta: { errorMessage: "모임 삭제에 실패했어요" },
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <p className="text-muted-foreground">
          내가 주최했거나 참여한 모임을 한눈에 봐요
        </p>
      </div>

      {gatheringsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : items.length === 0 ? (
        <EmptyState
          title="아직 모임 기록이 없어요"
          description="Map에서 새로운 모임을 만들거나 다른 모임에 참여해 보세요"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {items.map((item) => (
            <GatheringCard
              key={item.gathering.id}
              item={item}
              onOpen={() => setSelectedId(item.gathering.id)}
              onDelete={
                item.role === "host"
                  ? () =>
                      setPendingDelete(
                        (item as HostItem).gathering as GatheringPublic,
                      )
                  : undefined
              }
            />
          ))}
        </div>
      )}

      <GatheringDetailDialog
        gatheringId={selectedId}
        joined={selectedId !== null && hasJoined(selectedId)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
        onJoinedChange={(g, joined) => {
          if (joined) addJoined(g)
          else removeJoined(g.id)
        }}
      />

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setPendingDelete(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>모임 삭제</DialogTitle>
            <DialogDescription>
              <strong>'{pendingDelete?.title}'</strong> 모임을 삭제할까요? 이
              작업은 되돌릴 수 없어요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline" disabled={deleteMutation.isPending}>
                취소
              </Button>
            </DialogClose>
            <LoadingButton
              variant="destructive"
              onClick={() =>
                pendingDelete && deleteMutation.mutate(pendingDelete.id)
              }
              loading={deleteMutation.isPending}
            >
              삭제
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const ROLE_LABEL: Record<Role, string> = {
  host: "주최",
  participant: "참여",
}

const ROLE_CLASS: Record<Role, string> = {
  host: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  participant: "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400",
}

function GatheringCard({
  item,
  onOpen,
  onDelete,
}: {
  item: Item
  onOpen: () => void
  onDelete?: () => void
}) {
  const { gathering, role } = item
  const label =
    SPORT_LABELS[gathering.sport_type as SportType] ?? gathering.sport_type

  return (
    <Card className="cursor-pointer py-0 transition-colors hover:bg-accent/30">
      <CardContent
        className="flex h-full flex-col gap-2 p-3"
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onOpen()
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
              ROLE_CLASS[role],
            )}
          >
            {ROLE_LABEL[role]}
          </span>
          {role === "host" && onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="size-7 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label="모임 삭제"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">
            {gathering.title}
          </span>
          <Badge variant="secondary" className="shrink-0">
            {label}
          </Badge>
        </div>
        <div className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3" />
            {new Date(gathering.starts_at).toLocaleString("ko-KR", {
              month: "numeric",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="inline-flex items-center gap-1 truncate">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{gathering.place_name}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3" />
            정원 {gathering.max_participants}명
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <HistoryIcon className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
