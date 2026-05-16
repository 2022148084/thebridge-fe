import { zodResolver } from "@hookform/resolvers/zod"
import type { ReactNode } from "react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
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
import { Slider } from "@/components/ui/slider"
import useCustomToast from "@/hooks/useCustomToast"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  "러닝",
  "사이클",
  "등산",
  "헬스",
  "요가/필라테스",
  "구기종목",
  "기타",
] as const

const CAPACITY_OPTIONS = [5, 10, 15, 20] as const

const DIFFICULTY_COLORS = [
  "bg-green-500",
  "bg-lime-500",
  "bg-yellow-500",
  "bg-orange-500",
  "bg-red-500",
] as const

const DIFFICULTY_LABELS = [
  "매우 쉬움",
  "쉬움",
  "보통",
  "어려움",
  "매우 어려움",
] as const

const formSchema = z.object({
  title: z.string().min(1, { message: "제목을 입력해 주세요." }),
  category: z.enum(CATEGORIES, { message: "카테고리를 선택해 주세요." }),
  date: z.string().min(1, { message: "날짜와 시간을 선택해 주세요." }),
  location: z.string().min(1, { message: "장소를 입력해 주세요." }),
  description: z.string().max(500).optional(),
  capacity: z.coerce
    .number()
    .refine((v) => (CAPACITY_OPTIONS as readonly number[]).includes(v), {
      message: "정원을 선택해 주세요.",
    }),
  energyLevel: z.number().min(0).max(100),
  difficulty: z.coerce
    .number()
    .int()
    .min(1, { message: "난이도를 선택해 주세요." })
    .max(5),
})

export type CreateEventFormData = z.infer<typeof formSchema>

interface CreateEventDialogProps {
  trigger: ReactNode
  onCreated?: (data: CreateEventFormData) => void
}

const CreateEventDialog = ({ trigger, onCreated }: CreateEventDialogProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { showSuccessToast } = useCustomToast()

  const form = useForm<CreateEventFormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      title: "",
      category: undefined,
      date: "",
      location: "",
      description: "",
      capacity: 0,
      energyLevel: 50,
      difficulty: 0,
    },
  })

  const onSubmit = async (data: CreateEventFormData) => {
    setSubmitting(true)
    try {
      onCreated?.(data)
      showSuccessToast(`'${data.title}' 모임이 생성되었어요.`)
      form.reset()
      setIsOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Event generation</DialogTitle>
          <DialogDescription>
            함께할 사람들을 위해 모임 정보를 입력해 주세요.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid max-h-[60vh] gap-4 overflow-y-auto py-2 pr-1">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Event title <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="예) 한강 저녁 러닝"
                          type="text"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Category <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
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
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Date / Time{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Location <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="예) 반포 한강공원 잠수교 앞"
                            type="text"
                            {...field}
                          />
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <textarea
                            {...field}
                            rows={4}
                            placeholder="모임에 대해 짧게 소개해 주세요."
                            className={cn(
                              "border-input placeholder:text-muted-foreground dark:bg-input/30 flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow]",
                              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                              "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>
                            Capacity <span className="text-destructive">*</span>
                          </FormLabel>
                          <span className="text-muted-foreground text-xs">
                            {(CAPACITY_OPTIONS as readonly number[]).includes(
                              field.value,
                            )
                              ? `${field.value}명`
                              : "선택 안 됨"}
                          </span>
                        </div>
                        <div
                          className="flex overflow-hidden rounded-md border"
                          role="radiogroup"
                          aria-label="정원"
                        >
                          {CAPACITY_OPTIONS.map((n) => {
                            const selected = field.value === n
                            return (
                              <label
                                key={n}
                                className={cn(
                                  "flex h-7 flex-1 cursor-pointer items-center justify-center border-r text-xs font-medium transition-colors last:border-r-0",
                                  selected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-muted/70",
                                )}
                              >
                                <input
                                  type="radio"
                                  name={field.name}
                                  value={n}
                                  checked={selected}
                                  onChange={() => field.onChange(n)}
                                  className="sr-only"
                                  aria-label={`${n}명`}
                                />
                                {n}
                              </label>
                            )
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="energyLevel"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>
                            Energy level{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                        </div>
                        <div className="flex items-center gap-3 py-1">
                          <span
                            role="img"
                            aria-label="차분"
                            className="text-lg leading-none"
                          >
                            🧘
                          </span>
                          <FormControl>
                            <Slider
                              min={0}
                              max={100}
                              step={1}
                              value={[field.value]}
                              onValueChange={(v) => field.onChange(v[0])}
                              className="flex-1"
                            />
                          </FormControl>
                          <span
                            role="img"
                            aria-label="활발"
                            className="text-lg leading-none"
                          >
                            🔥
                          </span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>
                            Difficulty{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                        </div>
                        <div className="flex items-center gap-3 py-1">
                          <span
                            role="img"
                            aria-label="쉬움"
                            className="text-lg leading-none"
                          >
                            🚶
                          </span>
                          <div
                            className="flex flex-1 overflow-hidden rounded-md border"
                            role="radiogroup"
                            aria-label="난이도"
                          >
                            {DIFFICULTY_COLORS.map((color, idx) => {
                              const level = idx + 1
                              const selected = field.value === level
                              const filled = field.value >= level
                              return (
                                <label
                                  key={color}
                                  className={cn(
                                    "h-7 flex-1 cursor-pointer border-r last:border-r-0 transition-opacity",
                                    color,
                                    filled
                                      ? "opacity-100"
                                      : "opacity-25 hover:opacity-60",
                                  )}
                                >
                                  <input
                                    type="radio"
                                    name={field.name}
                                    value={level}
                                    checked={selected}
                                    onChange={() => field.onChange(level)}
                                    className="sr-only"
                                    aria-label={`Lv.${level} ${DIFFICULTY_LABELS[idx]}`}
                                  />
                                </label>
                              )
                            })}
                          </div>
                          <span
                            role="img"
                            aria-label="어려움"
                            className="text-lg leading-none"
                          >
                            🏋️
                          </span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-2">
              <DialogClose asChild>
                <Button variant="outline" disabled={submitting}>
                  취소
                </Button>
              </DialogClose>
              <LoadingButton type="submit" loading={submitting}>
                만들기
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateEventDialog
