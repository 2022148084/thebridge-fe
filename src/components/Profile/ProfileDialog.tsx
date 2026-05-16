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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { AVATARS } from "@/lib/avatars"
import { FIELD_INPUT, FIELD_LABEL, FIGMA_DIALOG } from "@/lib/figma-styles"
import { cn } from "@/lib/utils"
import { handleError } from "@/utils"

const SEX_OPTIONS = [
  { value: "0", label: "Prefer not to say" },
  { value: "1", label: "Male" },
  { value: "2", label: "Female" },
] as const

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={cn(FIGMA_DIALOG, "sm:max-w-3xl")}>
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#161b24]">
            Edit Your Profile
          </DialogTitle>
          <DialogDescription>
            Update your personal information and pick an avatar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-6 md:grid-cols-[1fr_auto]"
          >
            <div className="flex flex-col gap-4">
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

              <div className="grid grid-cols-2 gap-3">
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
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className={cn(FIELD_INPUT, "w-full")}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SEX_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
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
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={FIELD_LABEL}>City</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Seoul"
                        className={FIELD_INPUT}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="avatar_index"
              render={({ field }) => (
                <FormItem className="md:w-72 md:border-l md:border-[#b3b9c2] md:pl-6">
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
                            "relative flex aspect-square items-center justify-center rounded-full ring-offset-2 ring-offset-background transition",
                            selected
                              ? "ring-2 ring-[#44a16f]"
                              : "hover:opacity-80",
                          )}
                        >
                          <UserAvatar avatarIndex={idx} className="size-full" />
                          {selected && (
                            <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-[#44a16f] text-white">
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

            <div className="flex justify-end gap-2 pt-2 md:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Save
              </LoadingButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default ProfileDialog
