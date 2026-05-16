import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Search, UserMinus, UserPlus, UserRound } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import {
  type FriendRequestPublic,
  FriendsService,
  type UserPublic,
  UsersService,
} from "@/client"
import UserAvatar from "@/components/Profile/UserAvatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoadingButton } from "@/components/ui/loading-button"

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

function FriendsPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())
  const [pendingRemove, setPendingRemove] = useState<UserPublic | null>(null)

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
      setPendingRemove(null)
    },
    meta: { errorMessage: "친구 삭제에 실패했어요" },
  })

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

  return (
    <div className="-mx-6 -my-6 grid min-h-[calc(100svh-3.5rem-4.5rem)] grid-cols-1 md:-mx-8 md:-my-8 md:grid-cols-[minmax(280px,1fr)_2fr]">
      <aside className="flex flex-col gap-4 bg-[#f4ebe8] p-6 md:p-8">
        <h2 className="font-['Stack_Sans_Headline'] text-2xl font-bold text-[#161b24]">
          Friends
        </h2>
        <div className="h-px bg-[#b3b9c2]/40" />

        {requests.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-[#44a16f] uppercase">
              Pending requests ({requests.length})
            </span>
            {requests.map((req) => (
              <RequestRow
                key={req.id}
                request={req}
                onAccept={() => acceptMutation.mutate(req)}
                onReject={() => rejectMutation.mutate(req)}
                disabled={acceptMutation.isPending || rejectMutation.isPending}
              />
            ))}
            <div className="my-1 h-px bg-[#b3b9c2]/40" />
          </div>
        )}

        {friendsQuery.isLoading ? (
          <p className="text-sm text-[#161b24]/60">불러오는 중…</p>
        ) : friends.length === 0 ? (
          <EmptyHint
            icon={<UserRound className="size-6 text-[#44a16f]" />}
            text="아직 친구가 없어요. 우측에서 검색해 친구를 추가하세요."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {friends.map((friend) => (
              <li
                key={friend.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <UserAvatar
                    avatarIndex={friend.avatar_index}
                    fallbackInitials={displayName(friend)[0]?.toUpperCase()}
                    className="size-12 shrink-0"
                  />
                  <span className="truncate font-semibold text-[#161b24]">
                    {displayName(friend)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingRemove(friend)}
                  aria-label={`${displayName(friend)} 친구 삭제`}
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#44a16f] shadow-[0_2px_6px_-2px_rgba(0,0,0,0.1)] transition hover:bg-[#44a16f]/10"
                >
                  <UserMinus className="size-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section
        className="relative bg-center bg-cover p-6 md:p-8"
        style={{ backgroundImage: "url('/assets/images/landing-map-bg.png')" }}
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-3 pt-12">
          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type user name or email"
              className="flex-1 bg-transparent text-[#161b24] outline-none placeholder:text-[#979797]"
            />
            <div className="h-6 w-px bg-[#b3b9c2]/40" />
            <Search className="size-5 text-[#44a16f]" />
          </div>

          {searchEnabled && (
            <div className="rounded-2xl bg-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)]">
              {searchUsersQuery.isLoading ? (
                <p className="p-4 text-sm text-[#161b24]/60">검색 중…</p>
              ) : searchResults.length === 0 ? (
                <p className="p-4 text-sm text-[#161b24]/60">
                  검색 결과가 없어요
                </p>
              ) : (
                <ul className="divide-y divide-[#b3b9c2]/30">
                  {searchResults.map((person) => {
                    const sent = sentIds.has(person.id)
                    const sending =
                      addMutation.isPending &&
                      addMutation.variables?.id === person.id
                    return (
                      <li
                        key={person.id}
                        className="flex items-center gap-3 p-3"
                      >
                        <UserAvatar
                          avatarIndex={person.avatar_index}
                          fallbackInitials={displayName(
                            person,
                          )[0]?.toUpperCase()}
                          className="size-12 shrink-0"
                        />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate font-medium text-[#161b24]">
                            {person.email}
                          </span>
                          <span className="truncate text-sm text-[#161b24]/70">
                            {person.full_name ?? ""}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => addMutation.mutate(person)}
                          disabled={sent || sending}
                          aria-label={`${displayName(person)} 친구 추가`}
                          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#44a16f] text-white shadow-[0_2px_6px_-2px_rgba(0,0,0,0.15)] transition hover:bg-[#3a8f60] disabled:opacity-50"
                        >
                          <UserPlus className="size-5" />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>

      <Dialog
        open={pendingRemove !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setPendingRemove(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>친구 삭제</DialogTitle>
            <DialogDescription>
              <strong>
                '{pendingRemove ? displayName(pendingRemove) : ""}'
              </strong>{" "}
              님을 친구 목록에서 삭제할까요?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setPendingRemove(null)}
              disabled={deleteMutation.isPending}
              className="h-10 rounded-md border border-[#b3b9c2]/40 px-4 text-sm font-medium text-[#161b24]"
            >
              취소
            </button>
            <LoadingButton
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={() =>
                pendingRemove && deleteMutation.mutate(pendingRemove)
              }
            >
              삭제
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RequestRow({
  request,
  onAccept,
  onReject,
  disabled,
}: {
  request: FriendRequestPublic
  onAccept: () => void
  onReject: () => void
  disabled: boolean
}) {
  const person = request.requester
  return (
    <div className="flex items-center gap-3">
      <UserAvatar
        avatarIndex={person.avatar_index}
        fallbackInitials={displayName(person)[0]?.toUpperCase()}
        className="size-10 shrink-0"
      />
      <span className="flex-1 truncate text-sm font-medium text-[#161b24]">
        {displayName(person)}
      </span>
      <button
        type="button"
        onClick={onAccept}
        disabled={disabled}
        className="rounded-md bg-[#44a16f] px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
      >
        수락
      </button>
      <button
        type="button"
        onClick={onReject}
        disabled={disabled}
        className="rounded-md border border-[#b3b9c2]/40 px-2 py-1 text-xs font-semibold text-[#161b24] disabled:opacity-50"
      >
        거절
      </button>
    </div>
  )
}

function EmptyHint({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <div className="rounded-full bg-white p-3 shadow-sm">{icon}</div>
      <p className="text-sm text-[#161b24]/60">{text}</p>
    </div>
  )
}
