import { drizzle } from "drizzle-orm/neon-http"

import * as schema from "@/db/schema"

let database: ReturnType<typeof createDatabase> | undefined

function createDatabase() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.")
  }

  return drizzle(connectionString, { schema })
}

export function getDatabase() {
  database ??= createDatabase()
  return database
}
