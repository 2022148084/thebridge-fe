import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type ReactNode, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  type GatheringPublic,
  GatheringsService,
  type GatheringUpdate,
} from "@/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import useCustomToast from "@/hooks/useCustomToast"
import { FIELD_INPUT, FIELD_LABEL, FIGMA_DIALOG } from "@/lib/figma-styles"
import { cn } from "@/lib/utils"
import { handleError } from "@/utils"

const CAPACITY_OPTIONS = [5, 10, 15, 20] as const
const DURATION_OPTIONS = [30, 60, 90, 120] as const
const DIFFICULTY_OPTIONS = [1, 2, 3, 4, 5] as const

const formSchema = z.object({
  title: z.string().min(1, { message: "제목을 입력해 주세요." }),
  description: z.string().max(500).optional(),
  starts_at: z.string().min(1, { message: "일시를 선택해 주세요." }),
  duration_min: z.coerce
    .number()
    .refine((v) => (DURATION_OPTIONS as readonly number[]).includes(v), {
      message: "소요 시간을 선택해 주세요.",
    }),
  max_participants: z.coerce
    .number()
    .refine((v) => (CAPACITY_OPTIONS as readonly number[]).includes(v), {
      message: "정원을 선택해 주세요.",
    }),
  level: z.coerce.number().int().min(1).max(5),
})

type FormData = z.infer<typeof formSchema>

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60000)
  return local.toISOString().slice(0, 16)
}

interface EditGatheringDialogProps {
  gathering: GatheringPublic
  trigger: ReactNode
  onUpdated?: (gathering: GatheringPublic) => void
}

export function EditGatheringDialog({
  gathering,
  trigger,
  onUpdated,
}: EditGatheringDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      title: gathering.title,
      description: gathering.description ?? "",
      starts_at: toDatetimeLocal(gathering.starts_at),
      duration_min: gathering.duration_min,
      max_participants: gathering.max_participants,
      level: gathering.level,
    },
  })

  const updateMutation = useMutation({
    mutationFn: (body: GatheringUpdate) =>
      GatheringsService.updateGathering({
        id: gathering.id,
        requestBody: body,
      }),
    onSuccess: (updated) => {
      showSuccessToast("모임 정보가 수정되었어요.")
      queryClient.invalidateQueries({ queryKey: ["gathering", gathering.id] })
      queryClient.invalidateQueries({ queryKey: ["gatherings"] })
      queryClient.invalidateQueries({ queryKey: ["my-participations"] })
      onUpdated?.(updated)
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
  })

  const onSubmit = (data: FormData) => {
    if (updateMutation.isPending) return
    const body: GatheringUpdate = {
      title: data.title,
      description: data.description?.trim() || null,
      starts_at: new Date(data.starts_at).toISOString(),
      duration_min: data.duration_min,
      max_participants: data.max_participants,
      level: data.level,
    }
    updateMutation.mutate(body)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={cn(FIGMA_DIALOG, "sm:max-w-md")}>
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#161b24]">
            모임 수정
          </DialogTitle>
          <DialogDescription>
            모임 정보를 변경합니다. 장소·종목은 새 모임을 만들어 주세요.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={FIELD_LABEL}>제목</FormLabel>
                  <FormControl>
                    <Input type="text" className={FIELD_INPUT} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={FIELD_LABEL}>설명</FormLabel>
                  <FormControl>
                    <textarea
                      rows={3}
                      className={cn(
                        "placeholder:text-muted-foreground border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] dark:bg-input/30",
                        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="starts_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={FIELD_LABEL}>일시</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      className={FIELD_INPUT}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="duration_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={FIELD_LABEL}>소요 시간</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger className={cn(FIELD_INPUT, "w-full")}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DURATION_OPTIONS.map((d) => (
                          <SelectItem key={d} value={String(d)}>
                            {d}분
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_participants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={FIELD_LABEL}>정원</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger className={cn(FIELD_INPUT, "w-full")}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CAPACITY_OPTIONS.map((c) => (
                          <SelectItem key={c} value={String(c)}>
                            {c}명
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={FIELD_LABEL}>난이도</FormLabel>
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger className={cn(FIELD_INPUT, "w-full")}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DIFFICULTY_OPTIONS.map((lv) => (
                        <SelectItem key={lv} value={String(lv)}>
                          Lv.{lv}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={updateMutation.isPending}
              >
                취소
              </Button>
              <LoadingButton type="submit" loading={updateMutation.isPending}>
                저장
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default EditGatheringDialog
