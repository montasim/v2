import { register } from "node:module"

register("./toon-raw-loader.ts", import.meta.url)

const evaluation =
  await import("../features/chat/evaluation/run-live-evaluation.server")
await evaluation.runLiveEvaluationCli(process.argv.slice(2))
