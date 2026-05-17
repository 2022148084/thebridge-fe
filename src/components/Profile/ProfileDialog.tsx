import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Check } from "lucide-react"
import { type ReactNode, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { UsersService, type UserUpdateMe } from "@/client"
import UserAvatar from "@/components/Profile/UserAvatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { AVATARS } from "@/lib/avatars"
import { FIELD_INPUT, FIELD_LABEL } from "@/lib/figma-styles"
import { cn } from "@/lib/utils"
import { handleError } from "@/utils"

const formSchema = z.object({
  full_name: z
    .string()
    .max(255, { message: "Full Name must be 255 characters or fewer" })
    .optional(),
  email: z.string().email({ message: "Invalid email address" }),
  age: z
    .string()
    .optional()
    .refine(
      (v) => !v || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 120),
      { message: "Age must be a number between 1 and 120" },
    ),
  sex: z.enum(["0", "1", "2"]).optional(),
  city: z
    .string()
    .max(255, { message: "City must be 255 characters or fewer" })
    .optional(),
  avatar_index: z
    .number()
    .int()
    .min(0)
    .max(AVATARS.length - 1)
    .optional(),
})

type FormData = z.infer<typeof formSchema>

function defaultsFromUser(user: ReturnType<typeof useAuth>["user"]): FormData {
  return {
    full_name: user?.full_name ?? "",
    email: user?.email ?? "",
    age: user?.age != null ? String(user.age) : "",
    sex:
      user?.sex === 0 || user?.sex === 1 || user?.sex === 2
        ? (String(user.sex) as "0" | "1" | "2")
        : undefined,
    city: user?.city ?? "",
    avatar_index:
      typeof user?.avatar_index === "number" ? user.avatar_index : undefined,
  }
}

interface ProfileDialogProps {
  trigger: ReactNode
}

export function ProfileDialog({ trigger }: ProfileDialogProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: defaultsFromUser(user),
  })

  useEffect(() => {
    if (open) form.reset(defaultsFromUser(user))
  }, [open, user, form])

  const mutation = useMutation({
    mutationFn: (data: UserUpdateMe) =>
      UsersService.updateUserMe({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Profile updated.")
      setOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
    },
  })

  const onSubmit = (data: FormData) => {
    if (mutation.isPending) return
    const payload: UserUpdateMe = {
      full_name: data.full_name?.trim() ? data.full_name.trim() : null,
      email: data.email,
      age: data.age ? Number(data.age) : null,
      sex: data.sex ? Number(data.sex) : null,
      city: data.city?.trim() ? data.city.trim() : null,
      avatar_index: data.avatar_index ?? null,
    }
    mutation.mutate(payload)
  }

  const selectedAvatar = form.watch("avatar_index")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-[25px] border-0 bg-white p-6 text-[#161b24] shadow-[0_8px_60px_-10px_rgba(0,0,0,0.18)] sm:max-w-4xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Edit Your Profile</DialogTitle>
          <DialogDescription>
            Update your personal information and pick an avatar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-6 md:grid-cols-2 md:divide-x md:divide-[#b3b9c2]/40"
          >
            <div className="flex flex-col gap-5 md:pr-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={FIELD_LABEL}>User Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="user@email.com"
                        className={FIELD_INPUT}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={FIELD_LABEL}>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="John Doe"
                        className={FIELD_INPUT}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-[160px_1fr] gap-4">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={FIELD_LABEL}>Age</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={120}
                          placeholder="25"
                          className={FIELD_INPUT}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={FIELD_LABEL}>Gender</FormLabel>
                      <div className="flex h-11 items-center gap-6">
                        <GenderCheckbox
                          label="Male"
                          checked={field.value === "1"}
                          onChange={(c) => field.onChange(c ? "1" : "0")}
                        />
                        <GenderCheckbox
                          label="Female"
                          checked={field.value === "2"}
                          onChange={(c) => field.onChange(c ? "2" : "0")}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className={cn(FIELD_LABEL, "text-base")}>
                  Streak : 0 days
                </span>
                <StreakGrid />
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 md:pl-6">
              <h3 className="font-['Stack_Sans_Headline'] text-2xl font-bold text-[#161b24]">
                Me
              </h3>
              <div className="flex size-[120px] items-center justify-center overflow-hidden rounded-2xl bg-[#f1f2f4]">
                <UserAvatar
                  avatarIndex={selectedAvatar}
                  className="size-full"
                />
              </div>
              <FormField
                control={form.control}
                name="avatar_index"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className={FIELD_LABEL}>
                      Select your avatar
                    </FormLabel>
                    <div className="grid grid-cols-4 gap-3">
                      {AVATARS.map((_, idx) => {
                        const selected = field.value === idx
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => field.onChange(idx)}
                            aria-label={`Avatar ${idx + 1}`}
                            aria-pressed={selected}
                            className={cn(
                              "relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[#f1f2f4] transition",
                              selected
                                ? "ring-2 ring-[#44a16f] ring-offset-2"
                                : "hover:opacity-80",
                            )}
                          >
                            <UserAvatar
                              avatarIndex={idx}
                              className="size-full"
                            />
                            {selected && (
                              <span className="absolute right-1 bottom-1 flex size-5 items-center justify-center rounded-full bg-[#44a16f] text-white">
                                <Check className="size-3" />
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 md:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                loading={mutation.isPending}
                className="bg-[#44a16f] text-white hover:bg-[#3a8f60]"
              >
                Save
              </LoadingButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function GenderCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#161b24]">
      <span className="relative inline-flex size-6 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer absolute inset-0 size-full cursor-pointer appearance-none rounded-[5px] border-[1.5px] border-[rgba(66,80,102,0.4)] bg-white transition checked:border-[#44a16f] checked:bg-[#44a16f]"
        />
        <Check className="pointer-events-none size-4 text-white opacity-0 peer-checked:opacity-100" />
      </span>
      {label}
    </label>
  )
}

function StreakGrid() {
  const total = 12 * 4
  return (
    <div className="rounded-md border border-[#b3b9c2]/40 bg-white p-3">
      <div className="grid grid-cols-12 gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className="aspect-square rounded-[4px] bg-[#d9d9d9]" />
        ))}
      </div>
    </div>
  )
}

export default ProfileDialog
