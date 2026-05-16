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
          "rounded-[25px] border-0 bg-[#b6e3c8] p-6 text-[#161b24] shadow-[0_8px_60px_-10px_rgba(0,0,0,0.18)]",
          "max-h-[90vh] overflow-hidden",
          canChat ? "sm:max-w-4xl" : "sm:max-w-md",
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
            <DialogHeader className="sr-only">
              <DialogTitle>{gathering.title}</DialogTitle>
              <DialogDescription>
                {sportLabel} · Lv.{gathering.level}
              </DialogDescription>
            </DialogHeader>

            {canChat ? (
              <>
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-white/60 p-1 text-sm sm:hidden">
                  <button
                    type="button"
                    onClick={() => setMobileView("details")}
                    className={cn(
                      "rounded-md py-1.5 transition-colors",
                      mobileView === "details"
                        ? "bg-white text-[#161b24] shadow-sm"
                        : "text-[#161b24]/60",
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
                        ? "bg-white text-[#161b24] shadow-sm"
                        : "text-[#161b24]/60",
                    )}
                  >
                    채팅
                  </button>
                </div>

                <div className="grid min-h-0 gap-4 sm:grid-cols-[1fr_minmax(280px,1fr)]">
                  <div
                    className={cn(
                      "flex min-h-0 flex-col gap-4",
                      mobileView !== "details" && "hidden sm:flex",
                    )}
                  >
                    <h2 className="font-['Stack_Sans_Headline'] text-3xl font-bold text-[#161b24]">
                      Event Details
                    </h2>
                    <DetailsBlock
                      gathering={gathering}
                      sportLabel={sportLabel}
                    />
                  </div>
                  <div
                    className={cn(
                      "h-[60vh] min-h-0 sm:h-[65vh]",
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
              <div className="flex flex-col gap-4">
                <h2 className="font-['Stack_Sans_Headline'] text-3xl font-bold text-[#161b24]">
                  Event Details
                </h2>
                <DetailsBlock gathering={gathering} sportLabel={sportLabel} />
              </div>
            )}

            <DialogFooter className="gap-2">
              {isHost ? (
                <EditGatheringDialog
                  gathering={gathering}
                  trigger={
                    <Button className="bg-[#44a16f] text-white hover:bg-[#3a8f60]">
                      수정하기
                    </Button>
                  }
                />
              ) : joined ? (
                <LoadingButton
                  loading={cancelMutation.isPending}
                  disabled={busy}
                  onClick={() => cancelMutation.mutate(gathering.id)}
                  className="bg-[#f8c4c4] font-semibold text-[#161b24] hover:bg-[#f5b0b0]"
                >
                  참가 취소
                </LoadingButton>
              ) : (
                <LoadingButton
                  loading={joinMutation.isPending}
                  disabled={busy}
                  onClick={() => joinMutation.mutate(gathering.id)}
                  className="bg-[#44a16f] text-white hover:bg-[#3a8f60]"
                >
                  참가하기
                </LoadingButton>
              )}
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={busy}
                className="text-[#161b24]/70 hover:bg-white/40 hover:text-[#161b24]"
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

const DIFFICULTY_LABELS = [
  "",
  "Very Easy",
  "Easy",
  "Normal",
  "Hard",
  "Very Hard",
]

function DetailsBlock({
  gathering,
  sportLabel,
}: {
  gathering: GatheringPublic
  sportLabel: string
}) {
  const startsAt = new Date(gathering.starts_at)
  const dateText = `${startsAt.toLocaleDateString("en-GB")}, ${startsAt.toLocaleTimeString(
    "en-US",
    { hour: "numeric", minute: "2-digit" },
  )}`
  const difficulty =
    DIFFICULTY_LABELS[gathering.level] ?? `Lv.${gathering.level}`

  return (
    <div className="space-y-2 rounded-2xl bg-white p-5 text-sm leading-relaxed text-[#161b24] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]">
      <p>
        <span className="font-bold">Event Title:</span> {gathering.title}
      </p>
      <p>
        <span className="font-bold">Category:</span> {sportLabel}
      </p>
      <p>
        <span className="font-bold">Location:</span> {gathering.place_name}
        {gathering.city ? ` · ${gathering.city}` : ""}
      </p>
      <p>
        <span className="font-bold">Date & Time:</span> {dateText}
      </p>
      <p>
        <span className="font-bold">Capacity:</span>{" "}
        {gathering.max_participants}
      </p>
      {gathering.vibe.length > 0 && (
        <p>
          <span className="font-bold">Energy Level:</span>{" "}
          {gathering.vibe.join(", ")}
        </p>
      )}
      <p>
        <span className="font-bold">Difficulty:</span> {difficulty}
      </p>
      {gathering.description && (
        <p className="pt-2">
          <span className="font-bold">Description:</span>{" "}
          <span className="whitespace-pre-wrap">{gathering.description}</span>
        </p>
      )}
    </div>
  )
}

export default GatheringDetailDialog
