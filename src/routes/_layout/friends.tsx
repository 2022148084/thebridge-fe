import { createFileRoute } from "@tanstack/react-router"
import { Check, Search, UserPlus, UserRound, X } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const Route = createFileRoute("/_layout/friends")({
  component: FriendsPage,
  head: () => ({
    meta: [
      {
        title: "Friends - Hackathon Template",
      },
    ],
  }),
})

type FriendStatus = "online" | "offline"

type Person = {
  id: string
  name: string
  email: string
  avatar?: string
  bio?: string
  status: FriendStatus
  mutualFriends?: number
}

const INITIAL_FRIENDS: Person[] = [
  {
    id: "f1",
    name: "Jiwoo Park",
    email: "jiwoo@example.com",
    avatar: "https://i.pravatar.cc/150?img=12",
    bio: "프론트엔드 개발자. 커피와 React를 좋아합니다.",
    status: "online",
    mutualFriends: 4,
  },
  {
    id: "f2",
    name: "Minseo Lee",
    email: "minseo@example.com",
    avatar: "https://i.pravatar.cc/150?img=32",
    bio: "디자이너 / UI·UX. 산책하는 거 좋아해요.",
    status: "offline",
    mutualFriends: 2,
  },
  {
    id: "f3",
    name: "Hyunwoo Kim",
    email: "hyunwoo@example.com",
    avatar: "https://i.pravatar.cc/150?img=15",
    bio: "백엔드 개발자, 분산시스템에 관심 많음.",
    status: "online",
    mutualFriends: 7,
  },
  {
    id: "f4",
    name: "Yuna Choi",
    email: "yuna@example.com",
    avatar: "https://i.pravatar.cc/150?img=47",
    bio: "PM. 새로운 사람 만나는 거 좋아해요.",
    status: "offline",
    mutualFriends: 1,
  },
]

const INITIAL_REQUESTS: Person[] = [
  {
    id: "r1",
    name: "Doyoon Han",
    email: "doyoon@example.com",
    avatar: "https://i.pravatar.cc/150?img=22",
    bio: "ML 엔지니어. 같이 해커톤 나가요!",
    status: "online",
    mutualFriends: 3,
  },
  {
    id: "r2",
    name: "Sora Jung",
    email: "sora@example.com",
    avatar: "https://i.pravatar.cc/150?img=49",
    bio: "iOS 개발자",
    status: "offline",
    mutualFriends: 0,
  },
]

const DISCOVERABLE: Person[] = [
  {
    id: "d1",
    name: "Jaeho Kang",
    email: "jaeho@example.com",
    avatar: "https://i.pravatar.cc/150?img=8",
    bio: "안드로이드 개발자. 코틀린 사랑꾼.",
    status: "online",
    mutualFriends: 5,
  },
  {
    id: "d2",
    name: "Eunji Seo",
    email: "eunji@example.com",
    avatar: "https://i.pravatar.cc/150?img=44",
    bio: "데이터 엔지니어. 글쓰기 좋아함.",
    status: "offline",
    mutualFriends: 2,
  },
  {
    id: "d3",
    name: "Taehyun Oh",
    email: "taehyun@example.com",
    avatar: "https://i.pravatar.cc/150?img=18",
    bio: "DevOps. 새벽 러닝 중독.",
    status: "online",
    mutualFriends: 1,
  },
  {
    id: "d4",
    name: "Hana Yoon",
    email: "hana@example.com",
    avatar: "https://i.pravatar.cc/150?img=35",
    bio: "풀스택. 사이드 프로젝트 항상 환영.",
    status: "online",
    mutualFriends: 6,
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

function FriendsPage() {
  const [friends, setFriends] = useState<Person[]>(INITIAL_FRIENDS)
  const [requests, setRequests] = useState<Person[]>(INITIAL_REQUESTS)
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selected, setSelected] = useState<Person | null>(null)

  const filteredFriends = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return friends
    return friends.filter(
      (f) =>
        f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q),
    )
  }, [friends, query])

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const friendIds = new Set(friends.map((f) => f.id))
    const pool = DISCOVERABLE.filter((p) => !friendIds.has(p.id))
    if (!q) return pool
    return pool.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q),
    )
  }, [friends, searchQuery])

  const acceptRequest = (person: Person) => {
    setRequests((prev) => prev.filter((p) => p.id !== person.id))
    setFriends((prev) => [{ ...person }, ...prev])
    toast.success(`${person.name}님과 친구가 되었어요`)
  }

  const declineRequest = (person: Person) => {
    setRequests((prev) => prev.filter((p) => p.id !== person.id))
    toast(`${person.name}님의 요청을 거절했어요`)
  }

  const sendRequest = (person: Person) => {
    setSentIds((prev) => new Set(prev).add(person.id))
    toast.success(`${person.name}님에게 친구 요청을 보냈어요`)
  }

  const removeFriend = (person: Person) => {
    setFriends((prev) => prev.filter((p) => p.id !== person.id))
    toast(`${person.name}님을 친구 목록에서 삭제했어요`)
    setSelected(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Friends</h1>
          <p className="text-muted-foreground">
            친구를 관리하고 새로운 사람과 연결되어 보세요
          </p>
        </div>
      </div>

      <Tabs defaultValue="my-friends" className="gap-4">
        <TabsList>
          <TabsTrigger value="my-friends">
            내 친구
            <Badge variant="secondary" className="ml-1">
              {friends.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="requests">
            받은 요청
            {requests.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {requests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="discover">친구 찾기</TabsTrigger>
        </TabsList>

        <TabsContent value="my-friends" className="flex flex-col gap-4">
          <div className="relative max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="이름이나 이메일로 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {filteredFriends.length === 0 ? (
            <EmptyState
              icon={<UserRound className="size-8 text-muted-foreground" />}
              title={query ? "검색 결과가 없어요" : "아직 친구가 없어요"}
              description={
                query
                  ? "다른 키워드로 검색해 보세요"
                  : "친구 찾기 탭에서 새로운 친구를 만나보세요"
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredFriends.map((friend) => (
                <FriendCard
                  key={friend.id}
                  person={friend}
                  onClick={() => setSelected(friend)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="flex flex-col gap-3">
          {requests.length === 0 ? (
            <EmptyState
              icon={<UserPlus className="size-8 text-muted-foreground" />}
              title="받은 요청이 없어요"
              description="새로운 요청이 오면 여기에 표시됩니다"
            />
          ) : (
            requests.map((person) => (
              <Card key={person.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <button
                    type="button"
                    onClick={() => setSelected(person)}
                    className="flex flex-1 items-center gap-4 text-left"
                  >
                    <Avatar className="size-12">
                      <AvatarImage src={person.avatar} alt={person.name} />
                      <AvatarFallback>{initials(person.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">
                        {person.name}
                      </span>
                      <span className="truncate text-sm text-muted-foreground">
                        {person.email}
                      </span>
                      {person.mutualFriends ? (
                        <span className="text-xs text-muted-foreground">
                          함께 아는 친구 {person.mutualFriends}명
                        </span>
                      ) : null}
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => acceptRequest(person)}>
                      <Check />
                      수락
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => declineRequest(person)}
                    >
                      <X />
                      거절
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="discover" className="flex flex-col gap-4">
          <div className="relative max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="이름이나 이메일로 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {searchResults.length === 0 ? (
            <EmptyState
              icon={<Search className="size-8 text-muted-foreground" />}
              title="검색 결과가 없어요"
              description="다른 키워드로 검색해 보세요"
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((person) => {
                const sent = sentIds.has(person.id)
                return (
                  <Card key={person.id}>
                    <CardContent className="flex flex-col gap-3 p-4">
                      <button
                        type="button"
                        onClick={() => setSelected(person)}
                        className="flex items-center gap-3 text-left"
                      >
                        <Avatar className="size-12">
                          <AvatarImage src={person.avatar} alt={person.name} />
                          <AvatarFallback>
                            {initials(person.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-medium">
                            {person.name}
                          </span>
                          <span className="truncate text-sm text-muted-foreground">
                            {person.email}
                          </span>
                          {person.mutualFriends ? (
                            <span className="text-xs text-muted-foreground">
                              함께 아는 친구 {person.mutualFriends}명
                            </span>
                          ) : null}
                        </div>
                      </button>
                      <Button
                        size="sm"
                        variant={sent ? "outline" : "default"}
                        disabled={sent}
                        onClick={() => sendRequest(person)}
                      >
                        {sent ? (
                          <>
                            <Check />
                            요청 보냄
                          </>
                        ) : (
                          <>
                            <UserPlus />
                            친구 추가
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ProfileDialog
        person={selected}
        isFriend={selected ? friends.some((f) => f.id === selected.id) : false}
        onOpenChange={(open) => !open && setSelected(null)}
        onRemove={removeFriend}
      />
    </div>
  )
}

function FriendCard({
  person,
  onClick,
}: {
  person: Person
  onClick: () => void
}) {
  return (
    <Card className="overflow-hidden py-0 transition-colors hover:bg-accent/50">
      <button
        type="button"
        onClick={onClick}
        className="w-full cursor-pointer text-left"
      >
        <CardContent className="flex items-center gap-3 p-4">
          <div className="relative">
            <Avatar className="size-12">
              <AvatarImage src={person.avatar} alt={person.name} />
              <AvatarFallback>{initials(person.name)}</AvatarFallback>
            </Avatar>
            <span
              aria-hidden="true"
              className={`absolute right-0 bottom-0 size-3 rounded-full border-2 border-background ${
                person.status === "online" ? "bg-emerald-500" : "bg-zinc-400"
              }`}
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{person.name}</span>
            <span className="truncate text-sm text-muted-foreground">
              {person.email}
            </span>
          </div>
        </CardContent>
      </button>
    </Card>
  )
}

function ProfileDialog({
  person,
  isFriend,
  onOpenChange,
  onRemove,
}: {
  person: Person | null
  isFriend: boolean
  onOpenChange: (open: boolean) => void
  onRemove: (person: Person) => void
}) {
  return (
    <Dialog open={person !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {person && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarImage src={person.avatar} alt={person.name} />
                  <AvatarFallback className="text-lg">
                    {initials(person.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <DialogTitle>{person.name}</DialogTitle>
                  <DialogDescription>{person.email}</DialogDescription>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        person.status === "online" ? "default" : "secondary"
                      }
                    >
                      {person.status === "online" ? "온라인" : "오프라인"}
                    </Badge>
                    {person.mutualFriends ? (
                      <span className="text-xs text-muted-foreground">
                        함께 아는 친구 {person.mutualFriends}명
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </DialogHeader>
            {person.bio && (
              <p className="text-sm text-muted-foreground">{person.bio}</p>
            )}
            {isFriend && (
              <DialogFooter>
                <Button variant="destructive" onClick={() => onRemove(person)}>
                  친구 삭제
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
