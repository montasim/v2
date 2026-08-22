import { assistantExchanges } from "@/db/schema"
import { getDatabase } from "@/db/client.server"
import type {
  ChatExchange,
  ChatExchangeRecorder,
} from "@/features/chat/application/ports/chat-exchange-recorder"

export class DatabaseChatExchangeRecorder implements ChatExchangeRecorder {
  async record(exchange: ChatExchange) {
    await getDatabase().insert(assistantExchanges).values(exchange)
  }
}
