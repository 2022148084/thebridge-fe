import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { Body_login_login_access_token as AccessToken } from "@/client"
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
import useAuth from "@/hooks/useAuth"
import { FIELD_INPUT, FIELD_LABEL } from "@/lib/figma-styles"

const formSchema = z.object({
  username: z.string().email(),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" }),
}) satisfies z.ZodType<AccessToken>

type FormData = z.infer<typeof formSchema>

interface LoginFormProps {
  onSwitchToSignup?: () => void
}

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const { loginMutation } = useAuth()
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit = (data: FormData) => {
    if (loginMutation.isPending) return
    loginMutation.mutate(data)
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
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={FIELD_LABEL}>User Email</FormLabel>
                <FormControl>
                  <Input
                    data-testid="email-input"
                    placeholder="user@email.com"
                    type="email"
                    className={FIELD_INPUT}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={FIELD_LABEL}>Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    data-testid="password-input"
                    placeholder="Password"
                    className={FIELD_INPUT}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <LoadingButton type="submit" loading={loginMutation.isPending}>
            Log In
          </LoadingButton>
        </div>

        {onSwitchToSignup && (
          <div className="text-center text-sm">
            Don't have an account yet?{" "}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="underline underline-offset-4"
            >
              Sign up
            </button>
          </div>
        )}
      </form>
    </Form>
  )
}
