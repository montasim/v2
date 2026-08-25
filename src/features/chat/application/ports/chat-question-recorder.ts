export interface ChatQuestion {
  readonly conversationId: string
  readonly clientMessageId: string
  readonly question: string
}

export interface ChatQuestionRecorder {
  recordQuestion: (question: ChatQuestion) => Promise<void>
}
