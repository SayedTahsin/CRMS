import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"

const client = createClient({
  url: process.env.DATABASE_URL || "",
  authToken: process.env.DATABASE_AUTH_TOKEN,
})
client.execute("PRAGMA foreign_keys=ON;")

export const db = drizzle({ client })
export type db = typeof db
