import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { History as HistoryIcon, Pencil } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import {
  type GatheringPublic,
  GatheringsService,
  type ParticipatingGatheringPublic,
} from "@/client"
import EditGatheringDialog from "@/components/Events/EditGatheringDialog"
import GatheringDetailDialog from "@/components/Events/GatheringDetailDialog"
import { Button } from "@/components/ui/button"
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
import { useJoinedGatherings } from "@/lib/joinedGatherings"
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

type HostItem = { role: "host"; gathering: GatheringPublic }
type ParticipantItem = {
  role: "participant"
  gathering: ParticipatingGatheringPublic
}
type Item = HostItem | ParticipantItem

function isFinished(
  g: GatheringPublic | ParticipatingGatheringPublic,
): boolean {
  const endTime =
    new Date(g.starts_at).getTime() + (g.duration_min ?? 0) * 60_000
  return endTime < Date.now()
}

function HistoryPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [pendingDelete, setPendingDelete] = useState<GatheringPublic | null>(
    null,
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const {
    items: joinedMap,
    has: hasJoined,
    markJoined,
    markUnjoined,
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
    <div className="-mx-6 -my-6 min-h-[calc(100svh-3.5rem-4.5rem)] bg-[#b6e3c8] px-6 py-6 md:-mx-8 md:-my-8 md:px-8 md:py-8">
      {gatheringsQuery.isLoading ? (
        <p className="text-sm text-[#161b24]/60">불러오는 중…</p>
      ) : items.length === 0 ? (
        <EmptyState
          title="아직 모임 기록이 없어요"
          description="Map에서 새로운 모임을 만들거나 다른 모임에 참여해 보세요"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          if (joined) markJoined(g)
          else markUnjoined(g.id)
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

function StatusBadge({ finished }: { finished: boolean }) {
  return (
    <span
      className={cn(
        "inline-block rounded-md px-2 py-0.5 text-xs italic font-medium",
        finished ? "bg-[#7dc9a0] text-white" : "bg-[#7dc9a0] text-white",
      )}
    >
      {finished ? "finished" : "ongoing"}
    </span>
  )
}

function GatheringCard({
  item,
  onOpen,
  onDelete: _onDelete,
}: {
  item: Item
  onOpen: () => void
  onDelete?: () => void
}) {
  const { gathering, role } = item
  const finished = isFinished(gathering)
  const dateText = new Date(gathering.starts_at).toLocaleDateString("sv-SE")

  return (
    <div className="relative rounded-2xl bg-white p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.1)]">
      <div className="flex items-start justify-between gap-2">
        <StatusBadge finished={finished} />
        {role === "host" && (
          <EditGatheringDialog
            gathering={gathering as GatheringPublic}
            trigger={
              <button
                type="button"
                aria-label="모임 편집"
                className="text-[#44a16f] transition hover:text-[#3a8f60]"
                onClick={(e) => e.stopPropagation()}
              >
                <Pencil className="size-5" />
              </button>
            }
          />
        )}
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-3 block w-full text-left"
      >
        <h3 className="font-['Stack_Sans_Headline'] text-2xl font-bold text-[#161b24]">
          {gathering.title}
        </h3>
      </button>

      <div className="my-3 h-px bg-[#b3b9c2]/40" />

      {finished ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-[#161b24]/70">
            <span>{dateText}</span>
          </div>
          {gathering.description && (
            <p className="text-sm text-[#161b24] leading-snug">
              {gathering.description}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={onOpen}
            className="h-10 w-full rounded-lg bg-[#b6e3c8] font-semibold text-[#161b24] transition hover:bg-[#a3d9b8]"
          >
            Check Event Detail & Chat
          </button>
          <button
            type="button"
            onClick={onOpen}
            className="h-10 w-full rounded-lg bg-[#f8c4c4] font-semibold text-[#161b24] transition hover:bg-[#f5b0b0]"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
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
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 rounded-full bg-white p-4">
        <HistoryIcon className="size-8 text-[#44a16f]" />
      </div>
      <h3 className="text-lg font-semibold text-[#161b24]">{title}</h3>
      <p className="text-[#161b24]/60">{description}</p>
    </div>
  )
}
