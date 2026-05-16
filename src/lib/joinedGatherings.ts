import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo } from "react"

import {
  type GatheringPublic,
  type GatheringRecommendPublic,
  GatheringsService,
  type ParticipatingGatheringPublic,
  type ParticipatingGatheringsPublic,
} from "@/client"

export const PARTICIPATIONS_KEY = ["my-participations"] as const

export function useJoinedGatherings() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: PARTICIPATIONS_KEY,
    queryFn: () => GatheringsService.readMyParticipatingGatherings(),
  })

  const itemsMap = useMemo(() => {
    const map: Record<string, ParticipatingGatheringPublic> = {}
    for (const g of query.data?.data ?? []) {
      map[g.id] = g
    }
    return map
  }, [query.data])

  const has = useCallback((id: string) => id in itemsMap, [itemsMap])

  const markJoined = useCallback(
    (g: GatheringPublic | GatheringRecommendPublic) => {
      queryClient.setQueryData<ParticipatingGatheringsPublic>(
        PARTICIPATIONS_KEY,
        (old) => {
          const existing = old?.data ?? []
          if (existing.some((x) => x.id === g.id)) return old
          const stub = {
            ...g,
            participant_id: "optimistic",
            participant_status: "pending",
            joined_at: new Date().toISOString(),
          } as unknown as ParticipatingGatheringPublic
          return { data: [...existing, stub], count: existing.length + 1 }
        },
      )
      queryClient.invalidateQueries({ queryKey: PARTICIPATIONS_KEY })
    },
    [queryClient],
  )

  const markUnjoined = useCallback(
    (id: string) => {
      queryClient.setQueryData<ParticipatingGatheringsPublic>(
        PARTICIPATIONS_KEY,
        (old) => {
          if (!old) return old
          const data = old.data.filter((x) => x.id !== id)
          return { data, count: data.length }
        },
      )
      queryClient.invalidateQueries({ queryKey: PARTICIPATIONS_KEY })
    },
    [queryClient],
  )

  return {
    items: itemsMap,
    has,
    markJoined,
    markUnjoined,
    isLoading: query.isLoading,
  }
}
