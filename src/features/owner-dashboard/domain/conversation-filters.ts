export const CONVERSATION_MODEL_ALL = "all"
export const CONVERSATION_MODEL_NON_MODEL = "__non_model__"
export const CONVERSATION_MODEL_UNKNOWN = "__unknown_model__"

export type OwnerConversationFilters = {
  page: number
  query: string
  model: string
}
