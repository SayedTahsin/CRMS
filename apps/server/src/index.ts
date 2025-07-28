import "dotenv/config"
import { trpcServer } from "@hono/trpc-server"
import { Cron } from "croner"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { auth } from "./lib/auth"
import { createContext } from "./lib/context"
import { generateWeeklyClassHistory } from "./lib/cron-function"
import { appRouter } from "./routers/index"

const app = new Hono()

app.use(logger())
app.use(
  "/*",
  cors({
    origin: process.env.CORS_ORIGIN || "",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
)

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw))

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context })
    },
  }),
)

new Cron("50 23 * * 5", { timezone: "Asia/Dhaka" }, () => {
  generateWeeklyClassHistory()
})

app.get("/healthz", (c) => {
  return c.text("OK")
})

export default app
