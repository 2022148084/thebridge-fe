import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import { type GatheringPublic, GatheringsService } from "@/client"
import GatheringChatPanel from "@/components/Chat/GatheringChatPanel"
import {
  SPORT_LABELS,
  type SportType,
} from "@/components/Events/CreateEventDialog"
import EditGatheringDialog from "@/components/Events/EditGatheringDialog"
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
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { FIGMA_DIALOG } from "@/lib/figma-styles"
import { cn } from "@/lib/utils"
import { handleError } from "@/utils"

interface GatheringDetailDialogProps {
  gatheringId: string | null
  joined: boolean
  onOpenChange: (open: boolean) => void
  onJoinedChange: (gathering: GatheringPublic, joined: boolean) => void
}

type MobileView = "details" | "chat"

export function GatheringDetailDialog({
  gatheringId,
  joined,
  onOpenChange,
  onJoinedChange,
}: GatheringDetailDialogProps) {
  const open = gatheringId !== null
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [mobileView, setMobileView] = useState<MobileView>("details")

  useEffect(() => {
    if (!open) setMobileView("details")
  }, [open])

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
      onOpenChange(false)
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
  const isHost = !!gathering && !!user && gathering.host_id === user.id
  const canChat = !!gathering && (isHost || joined)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          FIGMA_DIALOG,
          "max-h-[90vh] overflow-hidden",
          canChat ? "sm:max-w-3xl" : "sm:max-w-md",
        )}
      >
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

            {canChat ? (
              <>
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm sm:hidden">
                  <button
                    type="button"
                    onClick={() => setMobileView("details")}
                    className={cn(
                      "rounded-md py-1.5 transition-colors",
                      mobileView === "details"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground",
                    )}
                  >
                    상세
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileView("chat")}
                    className={cn(
                      "rounded-md py-1.5 transition-colors",
                      mobileView === "chat"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground",
                    )}
                  >
                    채팅
                  </button>
                </div>

                <div className="grid min-h-0 sm:grid-cols-[1fr_1px_minmax(260px,1fr)] sm:gap-4">
                  <div
                    className={cn(
                      "min-h-0",
                      mobileView !== "details" && "hidden sm:block",
                    )}
                  >
                    <DetailsBlock gathering={gathering} />
                  </div>
                  <div className="hidden sm:block bg-border" />
                  <div
                    className={cn(
                      "h-[55vh] min-h-0 sm:h-[60vh]",
                      mobileView !== "chat" && "hidden sm:block",
                    )}
                  >
                    <GatheringChatPanel
                      gatheringId={gathering.id}
                      enabled={open}
                    />
                  </div>
                </div>
              </>
            ) : (
              <DetailsBlock gathering={gathering} />
            )}

            <DialogFooter>
              {isHost ? (
                <EditGatheringDialog
                  gathering={gathering}
                  trigger={<Button>수정하기</Button>}
                />
              ) : joined ? (
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

function DetailsBlock({ gathering }: { gathering: GatheringPublic }) {
  return (
    <div className="space-y-3 text-sm">
      <DetailRow label="일시">
        {new Date(gathering.starts_at).toLocaleString("ko-KR")} ·{" "}
        {gathering.duration_min}분
      </DetailRow>
      <DetailRow label="장소">
        📍 {gathering.place_name}
        {gathering.city ? ` · ${gathering.city}` : ""}
      </DetailRow>
      <DetailRow label="정원">최대 {gathering.max_participants}명</DetailRow>
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
