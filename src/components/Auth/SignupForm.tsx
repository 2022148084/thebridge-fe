import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { UserRegister } from "@/client"
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
import { PasswordInput } from "@/components/ui/password-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"

const SEX_OPTIONS = [
  { value: "0", label: "Prefer not to say" },
  { value: "1", label: "Male" },
  { value: "2", label: "Female" },
] as const

const formSchema = z
  .object({
    email: z.string().email(),
    full_name: z.string().min(1, { message: "Full Name is required" }),
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
    password: z
      .string()
      .min(1, { message: "Password is required" })
      .min(8, { message: "Password must be at least 8 characters" }),
    confirm_password: z
      .string()
      .min(1, { message: "Password confirmation is required" }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "The passwords don't match",
    path: ["confirm_password"],
  })

type FormData = z.infer<typeof formSchema>

interface SignupFormProps {
  onSwitchToLogin?: () => void
  onSuccess?: () => void
}

export function SignupForm({ onSwitchToLogin, onSuccess }: SignupFormProps) {
  const { signUpMutation } = useAuth()
  const { showSuccessToast } = useCustomToast()
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      full_name: "",
      age: "",
      sex: undefined,
      city: "",
      password: "",
      confirm_password: "",
    },
  })

  const onSubmit = (data: FormData) => {
    if (signUpMutation.isPending) return

    const submitData: UserRegister = {
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      age: data.age ? Number(data.age) : null,
      sex: data.sex ? Number(data.sex) : null,
      city: data.city?.trim() ? data.city.trim() : null,
    }
    signUpMutation.mutate(submitData, {
      onSuccess: () => {
        showSuccessToast("Account created. Please log in.")
        onSuccess?.()
      },
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input
                    data-testid="full-name-input"
                    placeholder="User"
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    data-testid="email-input"
                    placeholder="user@example.com"
                    type="email"
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
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="age-input"
                      placeholder="25"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={120}
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
                  <FormLabel>Sex</FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="sex-select">
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
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input
                    data-testid="city-input"
                    placeholder="Seoul"
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    data-testid="password-input"
                    placeholder="Password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirm_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    data-testid="confirm-password-input"
                    placeholder="Confirm Password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <LoadingButton
            type="submit"
            className="w-full"
            loading={signUpMutation.isPending}
          >
            Sign Up
          </LoadingButton>
        </div>

        {onSwitchToLogin && (
          <div className="text-center text-sm">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="underline underline-offset-4"
            >
              Log in
            </button>
          </div>
        )}
      </form>
    </Form>
  )
}
