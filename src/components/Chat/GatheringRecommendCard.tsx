import { useMutation } from "@tanstack/react-query"

import { type GatheringRecommendPublic, GatheringsService } from "@/client"
import {
  SPORT_LABELS,
  type SportType,
} from "@/components/Events/CreateEventDialog"
import { LoadingButton } from "@/components/ui/loading-button"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

interface GatheringRecommendCardProps {
  gathering: GatheringRecommendPublic
  joined: boolean
  onSelect: (id: string) => void
  onJoined: (gathering: GatheringRecommendPublic) => void
}

export function GatheringRecommendCard({
  gathering,
  joined,
  onSelect,
  onJoined,
}: GatheringRecommendCardProps) {
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const joinMutation = useMutation({
    mutationFn: (id: string) =>
      GatheringsService.joinGathering({ gatheringId: id }),
    onSuccess: () => {
      onJoined(gathering)
      showSuccessToast("참가 신청이 완료되었어요.")
    },
    onError: handleError.bind(showErrorToast),
  })

  const sportLabel =
    SPORT_LABELS[gathering.sport_type as SportType] ?? gathering.sport_type

  const handleClick = () => {
    onSelect(gathering.id)
    if (!joined && !joinMutation.isPending) {
      joinMutation.mutate(gathering.id)
    }
  }

  const startsAt = new Date(gathering.starts_at)
  const dateTimeText = `${startsAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}, ${startsAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })} (${gathering.duration_min} min)`

  return (
    <div className="space-y-3 rounded-2xl bg-white p-4 text-sm text-[#161b24] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-[15px]">Event Details</span>
        <span className="rounded-full bg-[#f58f8f] px-2 py-0.5 text-xs font-semibold text-white">
          {Math.round(gathering.match_percentage)}% match
        </span>
      </div>
      <div className="space-y-1 text-[13px] leading-relaxed">
        <p>
          <span className="font-semibold">Event Title:</span> {gathering.title}
        </p>
        <p>
          <span className="font-semibold">Category:</span> {sportLabel}
        </p>
        <p>
          <span className="font-semibold">Date & Time:</span> {dateTimeText}
        </p>
        <p>
          <span className="font-semibold">Place:</span> {gathering.place_name}
          {gathering.city ? ` · ${gathering.city}` : ""}
        </p>
        <p>
          <span className="font-semibold">Capacity:</span> /
          {gathering.max_participants} · Lv.{gathering.level}
        </p>
      </div>
      <div className="flex flex-col gap-2 pt-1">
        <LoadingButton
          className="h-10 w-full rounded-lg bg-[#b6e3c8] font-semibold text-[#161b24] shadow-none hover:bg-[#a3d9b8]"
          loading={joinMutation.isPending}
          onClick={handleClick}
        >
          {joined ? "상세 보기" : "Accept"}
        </LoadingButton>
        {!joined && (
          <button
            type="button"
            onClick={() => onSelect(gathering.id)}
            className="h-10 w-full rounded-lg bg-[#f8c4c4] font-semibold text-[#161b24] transition hover:bg-[#f5b0b0]"
          >
            Reject
          </button>
        )}
      </div>
    </div>
  )
}

export default GatheringRecommendCard
