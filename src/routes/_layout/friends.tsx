import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Check, Search, UserPlus, UserRound, X } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import {
  type FriendRequestPublic,
  FriendsService,
  type UserPublic,
  UsersService,
} from "@/client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

function displayName(u: UserPublic): string {
  return u.full_name?.trim() || u.email
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function FriendsPage() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<UserPublic | null>(null)

  const friendsQuery = useQuery({
    queryKey: ["friends"],
    queryFn: () => FriendsService.readFriends(),
  })
  const friends = friendsQuery.data?.data ?? []

  const requestsQuery = useQuery({
    queryKey: ["friend-requests"],
    queryFn: () => FriendsService.readFriendRequests(),
  })
  const requests = requestsQuery.data?.data ?? []

  const trimmedSearch = searchQuery.trim()
  const searchEnabled = trimmedSearch.length >= 1
  const searchUsersQuery = useQuery({
    queryKey: ["user-search", trimmedSearch],
    queryFn: () => UsersService.searchUsers({ q: trimmedSearch }),
    enabled: searchEnabled,
  })

  const friendIds = useMemo(() => new Set(friends.map((f) => f.id)), [friends])
  const searchResults = (searchUsersQuery.data?.data ?? []).filter(
    (u) => !friendIds.has(u.id),
  )

  const filteredFriends = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return friends
    return friends.filter(
      (f) =>
        displayName(f).toLowerCase().includes(q) ||
        f.email.toLowerCase().includes(q),
    )
  }, [friends, query])

  const acceptMutation = useMutation({
    mutationFn: (req: FriendRequestPublic) =>
      FriendsService.acceptFriendRequest({ requestId: req.id }),
    onSuccess: (_data, req) => {
      toast.success(`${displayName(req.requester)}님과 친구가 되었어요`)
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] })
      queryClient.invalidateQueries({ queryKey: ["friends"] })
    },
    meta: { errorMessage: "요청 수락에 실패했어요" },
  })

  const rejectMutation = useMutation({
    mutationFn: (req: FriendRequestPublic) =>
      FriendsService.rejectFriendRequest({ requestId: req.id }),
    onSuccess: (_data, req) => {
      toast(`${displayName(req.requester)}님의 요청을 거절했어요`)
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] })
    },
    meta: { errorMessage: "요청 거절에 실패했어요" },
  })

  const addMutation = useMutation({
    mutationFn: (user: UserPublic) =>
      FriendsService.addFriend({ friendId: user.id }),
    onSuccess: (_data, user) => {
      toast.success(`${displayName(user)}님에게 친구 요청을 보냈어요`)
      setSentIds((prev) => new Set(prev).add(user.id))
    },
    meta: { errorMessage: "친구 요청을 보낼 수 없어요" },
  })

  const deleteMutation = useMutation({
    mutationFn: (user: UserPublic) =>
      FriendsService.deleteFriend({ friendId: user.id }),
    onSuccess: (_data, user) => {
      toast(`${displayName(user)}님을 친구 목록에서 삭제했어요`)
      queryClient.invalidateQueries({ queryKey: ["friends"] })
      setSelected(null)
    },
    meta: { errorMessage: "친구 삭제에 실패했어요" },
  })

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

          {friendsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">불러오는 중…</p>
          ) : filteredFriends.length === 0 ? (
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
          {requestsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">불러오는 중…</p>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={<UserPlus className="size-8 text-muted-foreground" />}
              title="받은 요청이 없어요"
              description="새로운 요청이 오면 여기에 표시됩니다"
            />
          ) : (
            requests.map((req) => {
              const person = req.requester
              const accepting =
                acceptMutation.isPending &&
                acceptMutation.variables?.id === req.id
              const rejecting =
                rejectMutation.isPending &&
                rejectMutation.variables?.id === req.id
              return (
                <Card key={req.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <button
                      type="button"
                      onClick={() => setSelected(person)}
                      className="flex flex-1 items-center gap-4 text-left"
                    >
                      <Avatar className="size-12">
                        <AvatarFallback>
                          {initials(displayName(person))}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">
                          {displayName(person)}
                        </span>
                        <span className="truncate text-sm text-muted-foreground">
                          {person.email}
                        </span>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => acceptMutation.mutate(req)}
                        disabled={accepting || rejecting}
                      >
                        <Check />
                        수락
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectMutation.mutate(req)}
                        disabled={accepting || rejecting}
                      >
                        <X />
                        거절
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
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

          {!searchEnabled ? (
            <EmptyState
              icon={<Search className="size-8 text-muted-foreground" />}
              title="검색어를 입력해 주세요"
              description="이름이나 이메일로 사람을 찾아보세요"
            />
          ) : searchUsersQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">검색 중…</p>
          ) : searchResults.length === 0 ? (
            <EmptyState
              icon={<Search className="size-8 text-muted-foreground" />}
              title="검색 결과가 없어요"
              description="다른 키워드로 검색해 보세요"
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((person) => {
                const sent = sentIds.has(person.id)
                const sending =
                  addMutation.isPending &&
                  addMutation.variables?.id === person.id
                return (
                  <Card key={person.id}>
                    <CardContent className="flex flex-col gap-3 p-4">
                      <button
                        type="button"
                        onClick={() => setSelected(person)}
                        className="flex items-center gap-3 text-left"
                      >
                        <Avatar className="size-12">
                          <AvatarFallback>
                            {initials(displayName(person))}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-medium">
                            {displayName(person)}
                          </span>
                          <span className="truncate text-sm text-muted-foreground">
                            {person.email}
                          </span>
                        </div>
                      </button>
                      <Button
                        size="sm"
                        variant={sent ? "outline" : "default"}
                        disabled={sent || sending}
                        onClick={() => addMutation.mutate(person)}
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
        isFriend={selected ? friendIds.has(selected.id) : false}
        onOpenChange={(open) => !open && setSelected(null)}
        onRemove={(p) => deleteMutation.mutate(p)}
        removing={deleteMutation.isPending}
      />
    </div>
  )
}

function FriendCard({
  person,
  onClick,
}: {
  person: UserPublic
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
          <Avatar className="size-12">
            <AvatarFallback>{initials(displayName(person))}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{displayName(person)}</span>
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
  removing,
}: {
  person: UserPublic | null
  isFriend: boolean
  onOpenChange: (open: boolean) => void
  onRemove: (person: UserPublic) => void
  removing: boolean
}) {
  return (
    <Dialog open={person !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {person && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarFallback className="text-lg">
                    {initials(displayName(person))}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <DialogTitle>{displayName(person)}</DialogTitle>
                  <DialogDescription>{person.email}</DialogDescription>
                  {person.city && (
                    <span className="text-xs text-muted-foreground">
                      📍 {person.city}
                    </span>
                  )}
                </div>
              </div>
            </DialogHeader>
            {isFriend && (
              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={() => onRemove(person)}
                  disabled={removing}
                >
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
