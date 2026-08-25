import { and, eq, lte, or } from "drizzle-orm"

import { assistantChatRequests } from "@/db/schema"
import { getDatabase } from "@/db/client.server"
import { ChatRequestPendingError } from "@/features/chat/application/ports/chat-request-coordinator"
import type {
  ChatRequestCoordinator,
  CoordinatedChatRequest,
} from "@/features/chat/application/ports/chat-request-coordinator"
import { logger } from "@/lib/logger.server"

const DEFAULT_LEASE_MS = 60_000
const DEFAULT_WAIT_MS = 40_000
const DEFAULT_POLL_MS = 250
const MAX_POLL_MS = 1_000

interface DatabaseCoordinatorOptions {
  leaseMs?: number
  waitMs?: number
  pollMs?: number
}

export class DatabaseChatRequestCoordinator implements ChatRequestCoordinator {
  private readonly leaseMs: number
  private readonly waitMs: number
  private readonly pollMs: number

  constructor(options: DatabaseCoordinatorOptions = {}) {
    this.leaseMs = options.leaseMs ?? DEFAULT_LEASE_MS
    this.waitMs = options.waitMs ?? DEFAULT_WAIT_MS
    this.pollMs = options.pollMs ?? DEFAULT_POLL_MS
  }

  run = async <T>(request: CoordinatedChatRequest<T>): Promise<T> => {
    const completed = await request.findCompleted()
    if (completed !== null) return completed

    const waitUntil = Date.now() + this.waitMs
    let pollMs = this.pollMs
    for (;;) {
      throwIfAborted(request.signal)
      const leaseToken = await this.tryAcquire(
        request.conversationId,
        request.clientMessageId
      )
      if (leaseToken) {
        let published: T | null
        try {
          published = await request.findCompleted()
        } catch (error) {
          await this.releaseAfterFailedAcquisition(request, leaseToken)
          throw error
        }
        if (published !== null) {
          try {
            await this.markCompleted(request, leaseToken)
          } catch (error) {
            logger.warn(
              { errorType: errorName(error) },
              "Reacquired chat request completion could not be restored"
            )
          }
          return published
        }
        return this.runAsOwner(request, leaseToken)
      }

      const observed = await request.findCompleted()
      if (observed !== null) return observed

      const remainingMs = waitUntil - Date.now()
      if (remainingMs <= 0) throw new ChatRequestPendingError()
      await abortableDelay(Math.min(pollMs, remainingMs), request.signal)
      pollMs = Math.min(MAX_POLL_MS, Math.ceil(pollMs * 1.6))
    }
  }

  private async tryAcquire(conversationId: string, clientMessageId: string) {
    const now = new Date()
    const leaseToken = crypto.randomUUID()
    const leaseExpiresAt = new Date(now.getTime() + this.leaseMs)
    const rows = await getDatabase()
      .insert(assistantChatRequests)
      .values({
        conversationId,
        clientMessageId,
        status: "pending",
        leaseToken,
        leaseExpiresAt,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          assistantChatRequests.conversationId,
          assistantChatRequests.clientMessageId,
        ],
        set: {
          status: "pending",
          leaseToken,
          leaseExpiresAt,
          completedAt: null,
          updatedAt: now,
        },
        setWhere: or(
          eq(assistantChatRequests.status, "completed"),
          and(
            eq(assistantChatRequests.status, "pending"),
            lte(assistantChatRequests.leaseExpiresAt, now)
          )
        ),
      })
      .returning({ leaseToken: assistantChatRequests.leaseToken })
    return rows.at(0)?.leaseToken ?? null
  }

  private async runAsOwner<T>(
    request: CoordinatedChatRequest<T>,
    leaseToken: string
  ) {
    const stopHeartbeat = this.startLeaseHeartbeat(request, leaseToken)
    try {
      const result = await request.work()
      try {
        await this.markCompleted(request, leaseToken)
      } catch (error) {
        // The published exchange remains the authority even when this
        // bookkeeping write fails. A replay will still observe that result.
        logger.warn(
          { errorType: errorName(error) },
          "Chat request lease completion could not be stored"
        )
      }
      return result
    } catch (error) {
      try {
        await this.release(request, leaseToken)
      } catch (releaseError) {
        logger.warn(
          { errorType: errorName(releaseError) },
          "Failed chat request lease will expire before it can be retried"
        )
      }
      throw error
    } finally {
      stopHeartbeat()
    }
  }

  private startLeaseHeartbeat<T>(
    request: CoordinatedChatRequest<T>,
    leaseToken: string
  ) {
    const interval = setInterval(
      () => {
        void this.renew(request, leaseToken).catch((error: unknown) => {
          logger.warn(
            { errorType: errorName(error) },
            "Chat request lease could not be renewed"
          )
        })
      },
      Math.max(1_000, Math.floor(this.leaseMs / 3))
    )
    return () => clearInterval(interval)
  }

  private async renew<T>(
    request: CoordinatedChatRequest<T>,
    leaseToken: string
  ) {
    const now = new Date()
    await getDatabase()
      .update(assistantChatRequests)
      .set({
        leaseExpiresAt: new Date(now.getTime() + this.leaseMs),
        updatedAt: now,
      })
      .where(
        and(
          eq(assistantChatRequests.conversationId, request.conversationId),
          eq(assistantChatRequests.clientMessageId, request.clientMessageId),
          eq(assistantChatRequests.leaseToken, leaseToken),
          eq(assistantChatRequests.status, "pending")
        )
      )
  }

  private async markCompleted<T>(
    request: CoordinatedChatRequest<T>,
    leaseToken: string
  ) {
    const now = new Date()
    await getDatabase()
      .update(assistantChatRequests)
      .set({ status: "completed", completedAt: now, updatedAt: now })
      .where(
        and(
          eq(assistantChatRequests.conversationId, request.conversationId),
          eq(assistantChatRequests.clientMessageId, request.clientMessageId),
          eq(assistantChatRequests.leaseToken, leaseToken),
          eq(assistantChatRequests.status, "pending")
        )
      )
  }

  private async release<T>(
    request: CoordinatedChatRequest<T>,
    leaseToken: string
  ) {
    await getDatabase()
      .delete(assistantChatRequests)
      .where(
        and(
          eq(assistantChatRequests.conversationId, request.conversationId),
          eq(assistantChatRequests.clientMessageId, request.clientMessageId),
          eq(assistantChatRequests.leaseToken, leaseToken),
          eq(assistantChatRequests.status, "pending")
        )
      )
  }

  private async releaseAfterFailedAcquisition<T>(
    request: CoordinatedChatRequest<T>,
    leaseToken: string
  ) {
    try {
      await this.release(request, leaseToken)
    } catch (error) {
      logger.warn(
        { errorType: errorName(error) },
        "Failed chat request reacquisition will expire before retry"
      )
    }
  }
}

interface InMemoryCoordinatorOptions {
  waitMs?: number
}

export class InMemoryChatRequestCoordinator implements ChatRequestCoordinator {
  private readonly pending = new Map<string, Promise<unknown>>()
  private readonly waitMs: number

  constructor(options: InMemoryCoordinatorOptions = {}) {
    this.waitMs = options.waitMs ?? DEFAULT_WAIT_MS
  }

  run = async <T>(request: CoordinatedChatRequest<T>): Promise<T> => {
    const completed = await request.findCompleted()
    if (completed !== null) return completed

    const key = JSON.stringify([
      request.conversationId,
      request.clientMessageId,
    ])
    const existing = this.pending.get(key) as Promise<T> | undefined
    if (existing) {
      return waitForPending(existing, this.waitMs, request.signal)
    }

    const owned = request.work()
    this.pending.set(key, owned)
    try {
      return await owned
    } finally {
      if (this.pending.get(key) === owned) this.pending.delete(key)
    }
  }
}

function waitForPending<T>(
  pending: Promise<T>,
  waitMs: number,
  signal?: AbortSignal
) {
  return new Promise<T>((resolve, reject) => {
    let settled = false
    const finish = (callback: () => void) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      signal?.removeEventListener("abort", onAbort)
      callback()
    }
    const onAbort = () =>
      finish(() =>
        reject(signal?.reason ?? new DOMException("Aborted", "AbortError"))
      )
    const timeout = setTimeout(
      () => finish(() => reject(new ChatRequestPendingError())),
      waitMs
    )
    signal?.addEventListener("abort", onAbort, { once: true })
    if (signal?.aborted) onAbort()
    pending.then(
      (value) => finish(() => resolve(value)),
      (error: unknown) => finish(() => reject(error))
    )
  })
}

function abortableDelay(delayMs: number, signal?: AbortSignal) {
  if (signal?.aborted) {
    return Promise.reject(
      signal.reason ?? new DOMException("Aborted", "AbortError")
    )
  }
  return new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timeout)
      reject(signal?.reason ?? new DOMException("Aborted", "AbortError"))
    }
    const timeout = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort)
      resolve()
    }, delayMs)
    signal?.addEventListener("abort", onAbort, { once: true })
  })
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw signal.reason ?? new DOMException("Aborted", "AbortError")
  }
}

function errorName(error: unknown) {
  return error instanceof Error ? error.name : "UnknownError"
}
