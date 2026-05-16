import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { type GatheringPublic, GatheringsService } from "@/client"
import {
  SPORT_LABELS,
  type SportType,
} from "@/components/Events/CreateEventDialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoadingButton } from "@/components/ui/loading-button"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

interface GatheringDetailDialogProps {
  gatheringId: string | null
  joined: boolean
  onOpenChange: (open: boolean) => void
  onJoinedChange: (gathering: GatheringPublic, joined: boolean) => void
}

export function GatheringDetailDialog({
  gatheringId,
  joined,
  onOpenChange,
  onJoinedChange,
}: GatheringDetailDialogProps) {
  const open = gatheringId !== null
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const { data: gathering, isLoading } = useQuery({
    queryKey: ["gathering", gatheringId],
    queryFn: () =>
      GatheringsService.readGathering({ id: gatheringId as string }),
    enabled: open,
  })

  const joinMutation = useMutation({
    mutationFn: (id: string) =>
      GatheringsService.joinGathering({ gatheringId: id }),
    onSuccess: () => {
      if (gathering) onJoinedChange(gathering, true)
      showSuccessToast("참가 신청이 완료되었어요.")
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["gathering", gatheringId] })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      GatheringsService.cancelJoinGathering({ gatheringId: id }),
    onSuccess: () => {
      if (gathering) onJoinedChange(gathering, false)
      showSuccessToast("참가가 취소되었어요.")
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["gathering", gatheringId] })
    },
  })

  const sportLabel = gathering
    ? (SPORT_LABELS[gathering.sport_type as SportType] ?? gathering.sport_type)
    : ""

  const busy = joinMutation.isPending || cancelMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {isLoading || !gathering ? (
          <DialogHeader>
            <DialogTitle>불러오는 중…</DialogTitle>
            <DialogDescription>
              모임 정보를 가져오고 있습니다.
            </DialogDescription>
          </DialogHeader>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{gathering.title}</DialogTitle>
              <DialogDescription>
                {sportLabel} · Lv.{gathering.level}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-sm">
              <DetailRow label="일시">
                {new Date(gathering.starts_at).toLocaleString("ko-KR")} ·{" "}
                {gathering.duration_min}분
              </DetailRow>
              <DetailRow label="장소">
                📍 {gathering.place_name}
                {gathering.city ? ` · ${gathering.city}` : ""}
              </DetailRow>
              <DetailRow label="정원">
                최대 {gathering.max_participants}명
              </DetailRow>
              {gathering.vibe.length > 0 && (
                <DetailRow label="분위기">
                  <div className="flex flex-wrap gap-1">
                    {gathering.vibe.map((v) => (
                      <span
                        key={v}
                        className="rounded-full bg-muted px-2 py-0.5 text-xs"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </DetailRow>
              )}
              {gathering.description && (
                <DetailRow label="설명">
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {gathering.description}
                  </p>
                </DetailRow>
              )}
            </div>

            <DialogFooter>
              {joined ? (
                <LoadingButton
                  variant="outline"
                  loading={cancelMutation.isPending}
                  disabled={busy}
                  onClick={() => cancelMutation.mutate(gathering.id)}
                >
                  참가 취소
                </LoadingButton>
              ) : (
                <LoadingButton
                  loading={joinMutation.isPending}
                  disabled={busy}
                  onClick={() => joinMutation.mutate(gathering.id)}
                >
                  참가하기
                </LoadingButton>
              )}
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={busy}
              >
                닫기
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[64px_1fr] items-start gap-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div>{children}</div>
    </div>
  )
}

export default GatheringDetailDialog
