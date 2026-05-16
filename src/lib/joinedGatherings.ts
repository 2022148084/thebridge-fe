import { useCallback, useState } from "react"

import type { GatheringPublic, GatheringRecommendPublic } from "@/client"

export type JoinedGathering = {
  id: string
  title: string
  sport_type: string
  starts_at: string
  duration_min: number
  place_name: string
  city: string
  level: number
  max_participants: number
  joined_at: string
}

const STORAGE_KEY = "joined-gatherings"

function load(): Record<string, JoinedGathering> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function save(items: Record<string, JoinedGathering>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // storage may be unavailable (private mode, quota); silently skip
  }
}

export function clearJoinedGatherings() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function toJoinedGathering(
  g: GatheringPublic | GatheringRecommendPublic,
): JoinedGathering {
  return {
    id: g.id,
    title: g.title,
    sport_type: g.sport_type,
    starts_at: g.starts_at,
    duration_min: g.duration_min,
    place_name: g.place_name,
    city: g.city,
    level: g.level,
    max_participants: g.max_participants,
    joined_at: new Date().toISOString(),
  }
}

export function useJoinedGatherings() {
  const [items, setItems] = useState<Record<string, JoinedGathering>>(load)

  const add = useCallback((g: GatheringPublic | GatheringRecommendPublic) => {
    setItems((prev) => {
      const next = { ...prev, [g.id]: toJoinedGathering(g) }
      save(next)
      return next
    })
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      if (!(id in prev)) return prev
      const next = { ...prev }
      delete next[id]
      save(next)
      return next
    })
  }, [])

  const has = useCallback((id: string) => id in items, [items])

  return { items, add, remove, has }
}
