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

  return (
    <div className="space-y-2 rounded-lg border bg-card p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="flex-1 font-semibold">{gathering.title}</span>
        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {Math.round(gathering.match_percentage)}% match
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        {sportLabel} · Lv.{gathering.level} · 최대 {gathering.max_participants}
        명
      </div>
      <div className="text-xs text-muted-foreground">
        🕒 {new Date(gathering.starts_at).toLocaleString("ko-KR")} ·{" "}
        {gathering.duration_min}분
      </div>
      <div className="text-xs text-muted-foreground">
        📍 {gathering.place_name}
        {gathering.city ? ` · ${gathering.city}` : ""}
      </div>
      <LoadingButton
        size="sm"
        className="w-full"
        loading={joinMutation.isPending}
        onClick={handleClick}
      >
        {joined ? "상세 보기" : "참가하기"}
      </LoadingButton>
    </div>
  )
}

export default GatheringRecommendCard
