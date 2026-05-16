import { createFileRoute } from "@tanstack/react-router"
import { CalendarDays, MapPin, Pencil, Star } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_layout/review")({
  component: ReviewPage,
  head: () => ({
    meta: [
      {
        title: "Review - Hackathon Template",
      },
    ],
  }),
})

type AttendedEvent = {
  id: string
  title: string
  category: string
  date: string
  placeName: string
  city: string
  host: { name: string; avatar?: string }
}

type Review = {
  eventId: string
  rating: number
  comment: string
  createdAt: string
}

const ATTENDED_EVENTS: AttendedEvent[] = [
  {
    id: "e1",
    title: "한강 저녁 러닝",
    category: "러닝",
    date: "2026-05-10 19:00",
    placeName: "반포 한강공원 잠수교",
    city: "서울",
    host: { name: "Jiwoo Park", avatar: "https://i.pravatar.cc/150?img=12" },
  },
  {
    id: "e2",
    title: "북한산 둘레길 등산",
    category: "등산",
    date: "2026-05-04 08:30",
    placeName: "북한산국립공원 우이분소",
    city: "서울",
    host: { name: "Hyunwoo Kim", avatar: "https://i.pravatar.cc/150?img=15" },
  },
  {
    id: "e3",
    title: "잠실 풋살 한 판",
    category: "구기종목",
    date: "2026-04-27 20:00",
    placeName: "잠실종합운동장 보조경기장",
    city: "서울",
    host: { name: "Jaeho Kang", avatar: "https://i.pravatar.cc/150?img=8" },
  },
  {
    id: "e4",
    title: "성수동 모닝 요가",
    category: "요가/필라테스",
    date: "2026-04-20 07:00",
    placeName: "서울숲 가족마당",
    city: "서울",
    host: { name: "Yuna Choi", avatar: "https://i.pravatar.cc/150?img=47" },
  },
]

const INITIAL_REVIEWS: Review[] = [
  {
    eventId: "e3",
    rating: 5,
    comment: "팀 분위기 너무 좋았어요! 다음 모임도 꼭 참여할게요.",
    createdAt: "2026-04-28",
  },
  {
    eventId: "e4",
    rating: 4,
    comment: "아침 공기가 상쾌했고 강사님이 친절했어요.",
    createdAt: "2026-04-21",
  },
]

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function StarRow({
  rating,
  onChange,
  size = "size-5",
}: {
  rating: number
  onChange?: (n: number) => void
  size?: string
}) {
  const interactive = !!onChange
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= rating
        const Icon = (
          <Star
            className={cn(
              size,
              filled
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/40",
            )}
          />
        )
        if (!interactive) return <span key={n}>{Icon}</span>
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n}점`}
            className="cursor-pointer transition-transform hover:scale-110"
          >
            {Icon}
          </button>
        )
      })}
    </div>
  )
}

function ReviewPage() {
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS)
  const [editing, setEditing] = useState<AttendedEvent | null>(null)
  const [draftRating, setDraftRating] = useState(0)
  const [draftComment, setDraftComment] = useState("")

  const reviewById = useMemo(() => {
    const m = new Map<string, Review>()
    for (const r of reviews) m.set(r.eventId, r)
    return m
  }, [reviews])

  const pending = ATTENDED_EVENTS.filter((e) => !reviewById.has(e.id))
  const completed = ATTENDED_EVENTS.filter((e) => reviewById.has(e.id))

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    return sum / reviews.length
  }, [reviews])

  const openEditor = (event: AttendedEvent) => {
    const existing = reviewById.get(event.id)
    setDraftRating(existing?.rating ?? 0)
    setDraftComment(existing?.comment ?? "")
    setEditing(event)
  }

  const closeEditor = (open: boolean) => {
    if (!open) {
      setEditing(null)
      setDraftRating(0)
      setDraftComment("")
    }
  }

  const submitReview = () => {
    if (!editing) return
    if (draftRating === 0) {
      toast.error("별점을 선택해 주세요")
      return
    }
    const today = new Date().toISOString().slice(0, 10)
    setReviews((prev) => {
      const next = prev.filter((r) => r.eventId !== editing.id)
      next.unshift({
        eventId: editing.id,
        rating: draftRating,
        comment: draftComment.trim(),
        createdAt: today,
      })
      return next
    })
    toast.success(`'${editing.title}' 리뷰가 등록되었어요`)
    closeEditor(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Review</h1>
          <p className="text-muted-foreground">
            참여한 모임에 별점과 후기를 남겨보세요
          </p>
        </div>
        {reviews.length > 0 && (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <StarRow rating={Math.round(averageRating)} size="size-4" />
              <span className="text-sm font-medium">
                {averageRating.toFixed(1)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              내가 작성한 리뷰 {reviews.length}개
            </span>
          </div>
        )}
      </div>

      <Tabs defaultValue="pending" className="gap-4">
        <TabsList>
          <TabsTrigger value="pending">
            작성 대기
            {pending.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            내 리뷰
            <Badge variant="secondary" className="ml-1">
              {completed.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="flex flex-col gap-3">
          {pending.length === 0 ? (
            <EmptyState
              title="작성할 리뷰가 없어요"
              description="참여한 모든 모임에 리뷰를 남기셨네요!"
            />
          ) : (
            pending.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                action={
                  <Button size="sm" onClick={() => openEditor(event)}>
                    <Star />
                    리뷰 작성
                  </Button>
                }
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="flex flex-col gap-3">
          {completed.length === 0 ? (
            <EmptyState
              title="아직 작성한 리뷰가 없어요"
              description="작성 대기 탭에서 첫 리뷰를 남겨보세요"
            />
          ) : (
            completed.map((event) => {
              const review = reviewById.get(event.id)!
              return (
                <EventCard
                  key={event.id}
                  event={event}
                  action={
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditor(event)}
                    >
                      <Pencil />
                      수정
                    </Button>
                  }
                  review={review}
                />
              )
            })
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={editing !== null} onOpenChange={closeEditor}>
        <DialogContent className="sm:max-w-md">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>{editing.title}</DialogTitle>
                <DialogDescription>
                  {editing.date} · {editing.placeName}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">별점</span>
                  <StarRow
                    rating={draftRating}
                    onChange={setDraftRating}
                    size="size-7"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">후기</span>
                  <textarea
                    value={draftComment}
                    onChange={(e) => setDraftComment(e.target.value)}
                    rows={4}
                    placeholder="모임이 어땠는지 짧게 공유해 주세요."
                    className={cn(
                      "border-input placeholder:text-muted-foreground dark:bg-input/30 flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow]",
                      "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                    )}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">취소</Button>
                </DialogClose>
                <Button onClick={submitReview}>등록</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EventCard({
  event,
  action,
  review,
}: {
  event: AttendedEvent
  action: React.ReactNode
  review?: Review
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <Avatar className="size-10">
            <AvatarImage src={event.host.avatar} alt={event.host.name} />
            <AvatarFallback>{initials(event.host.name)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{event.title}</span>
              <Badge variant="secondary">{event.category}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                {event.date}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {event.placeName} · {event.city}
              </span>
            </div>
          </div>
          <div className="shrink-0">{action}</div>
        </div>
        {review && (
          <div className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <StarRow rating={review.rating} size="size-4" />
              <span className="text-xs text-muted-foreground">
                {review.createdAt}
              </span>
            </div>
            {review.comment && (
              <p className="text-sm text-foreground/90">{review.comment}</p>
            )}
          </div>
        )}
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
        <Star className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
