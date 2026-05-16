import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import { toast } from "sonner"
import { ApiError, OpenAPI } from "./client"
import { ThemeProvider } from "./components/theme-provider"
import { Toaster } from "./components/ui/sonner"
import "./index.css"
import { routeTree } from "./routeTree.gen"

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: { errorMessage?: string }
    mutationMeta: { errorMessage?: string }
  }
}

OpenAPI.BASE = import.meta.env.VITE_API_URL
OpenAPI.TOKEN = async () => {
  return localStorage.getItem("access_token") || ""
}

function extractDetail(error: Error): string | null {
  if (!(error instanceof ApiError)) return null
  const body = error.body as { detail?: unknown } | undefined
  const detail = body?.detail
  if (typeof detail === "string") return detail
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: unknown } | undefined
    if (typeof first?.msg === "string") return first.msg
  }
  return null
}

function handleApiError(
  error: Error,
  meta: { errorMessage?: string } | undefined,
) {
  if (error instanceof ApiError && [401, 403].includes(error.status)) {
    localStorage.removeItem("access_token")
    localStorage.removeItem("chat-recommendations")
    window.location.href = "/login"
    return
  }
  if (!meta?.errorMessage) return
  toast.error(extractDetail(error) ?? meta.errorMessage)
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => handleApiError(error, query.meta),
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) =>
      handleApiError(error, mutation.meta),
  }),
})

const router = createRouter({ routeTree })
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster richColors closeButton />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
