import Header from "@/components/header"
import Loader from "@/components/loader"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import type { trpc } from "@/utils/trpc"
import type { QueryClient } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import "../index.css"

export interface RouterAppContext {
  trpc: typeof trpc
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "Class Monitoring System",
      },
      {
        name: "description",
        content:
          "This is System for monitoring and Analysing of class data. Will be used by Teachers and Students.",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
})

function RootComponent() {
  const isFetching = useRouterState({
    select: (s) => s.isLoading,
  })
  return (
    <>
      <HeadContent />
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <div className="grid h-svh grid-rows-[auto_1fr]">
          <Header />
          <div className="m-2">{isFetching ? <Loader /> : <Outlet />}</div>
        </div>
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
    </>
  )
}
