# OpenRouter Gemma 4 31B free assessment

Checked 2026-08-23 using OpenRouter's public model APIs, first-party documentation, and three guarded text-only inference trials through the repository adapter: two with Gemma and one with GLM. Every trial used an exact `:free` model ID, zero price ceilings, no provider fallback, and zero-cost verification; all three ended with an upstream shared-pool 429 before generation. Free endpoint inventory is volatile, so the endpoint API links below are a point-in-time record rather than a permanent availability guarantee.

> **Runtime update — 2026-08-26:** This document preserves the earlier Gemma-specific assessment. The active runtime uses the ordered pool documented in the [README](../../README.md), with GLM 5.2 primary, two deterministic rotating curated fallbacks, and `openrouter/free` as the third and final automatic fallback. Each generation remains one OpenRouter request and stays within OpenRouter's three-ID `models` limit. Curated IDs are filtered for this chat's JSON/context requirements; the automatic router performs its own capability filtering before randomly choosing from currently available free models. The route shares one application circuit. This runtime decision supersedes the older one-model-per-request recommendation below; the exact-free allowlist, zero-price ceilings, and post-response zero-cost verification remain authoritative.

## Recommendation

`google/gemma-4-31b-it:free` is usable here as an **allowlisted opt-in OpenRouter model**, provided Google AI Studio's 55-day prompt retention is acceptable. It should not be an automatic second OpenRouter attempt today: failed free requests count against the shared allowance, and two guarded live trials both encountered the endpoint's upstream shared-pool limit. For this portfolio chat, Gemma's `response_format` support makes it a better strict-JSON candidate than Nemotron, but it does **not** support JSON-schema enforcement. The application's JSON parser, exact-evidence validator, rejection path, and direct-provider fallbacks must therefore remain authoritative.

Keep GLM 5.2 free as the primary OpenRouter model, followed by the existing direct Gemini and Groq fallbacks. Its current free endpoint advertises both `response_format` and `structured_outputs`, is on OpenRouter's ZDR list, and has materially stronger OpenRouter-published benchmark metadata. This ordering is an inference from official capability/benchmark metadata; neither free OpenRouter candidate completed a live repository-specific quality trial during this check because both encountered upstream shared-pool 429s.

## Account limit after the $10 purchase

OpenRouter says an account that has **purchased at least $10 in credits all-time** receives **1,000 free-model requests per day**, up from 50; the limit is shared by free-model requests rather than granted per model. OpenRouter's first-party rate-limit guidance also gives **20 requests per minute**, unchanged after the purchase, and says failed attempts count toward the daily allowance. Extra API keys or accounts do not raise these platform limits. Thus a user question that makes two separate OpenRouter API calls can consume two requests before Gemini/Groq fallback. The wording is “purchased”; a displayed balance that did not come from a qualifying purchase is not enough evidence of the higher tier. [OpenRouter limits](https://openrouter.ai/docs/api_reference/limits.md), [OpenRouter FAQ](https://openrouter.ai/docs/faq), [OpenRouter free-inference guidance](https://openrouter.ai/blog/tutorials/how-to-get-the-lowest-cost-llm-inference-on-openrouter/)

Reaching the free quota should produce a rate-limit failure, not silently bill the $10 balance, when the request uses an exact `:free` ID and has no paid model or tool fallback. OpenRouter describes `:free` as a static variant that is provided without model cost, subject to lower limits and availability. A negative account balance can still cause a 402 even for free models, but a qualifying positive $10 purchase does not create that condition. [OpenRouter limits](https://openrouter.ai/docs/api_reference/limits.md), [free variant documentation](https://openrouter.ai/docs/guides/routing/model-variants/free)

## Gemma live metadata

The exact ID is `google/gemma-4-31b-it:free`, its canonical slug is `google/gemma-4-31b-it-20260402`, and `expiration_date` is `null` (not deprecated). At check time, OpenRouter exposed **one** live endpoint: `Google AI Studio | google/gemma-4-31b-it-20260402:free`, provider tag `google-ai-studio`, with status `0` and approximately 99.95% one-day uptime. With only one endpoint, there is no same-model provider redundancy; application-level fallback is necessary. [Live single-model API](https://openrouter.ai/api/v1/model/google/gemma-4-31b-it:free), [live Gemma endpoint API](https://openrouter.ai/api/v1/models/google/gemma-4-31b-it%3Afree/endpoints)

Two separate zero-cost implementation checks during the same work session both reached OpenRouter but returned an upstream shared-pool 429 before generation. They did not establish answer quality and reinforce that catalog status does not guarantee immediate free capacity.

| Property                 | Official value                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Input / output           | text, image, or video input; text output                                                                                  |
| Context                  | 262,144 tokens                                                                                                            |
| Maximum completion       | 32,768 tokens                                                                                                             |
| Default reasoning        | optional and off by default                                                                                               |
| Endpoint parameters      | `reasoning`, `include_reasoning`, `max_tokens`, `temperature`, `top_p`, `seed`, `response_format`, `tools`, `tool_choice` |
| Strict structured output | **No**: `structured_outputs` is absent                                                                                    |
| JSON mode                | **Yes**: `response_format` is supported, without JSON-schema enforcement                                                  |

OpenRouter distinguishes `response_format` (format specification) from `structured_outputs` (JSON-schema enforcement), and its Gemma page explicitly describes this model as JSON output without schema enforcement. OpenRouter's parameter guide says `response_format: { "type": "json_object" }` guarantees syntactically valid JSON when the prompt also asks for JSON; it does not guarantee this application's claim shape or grounding. [Models API field definitions](https://openrouter.ai/docs/guides/overview/models), [Gemma model page](https://openrouter.ai/google/gemma-4-31b-it%3Afree), [parameter guide](https://openrouter.ai/docs/api_reference/parameters), [structured-output documentation](https://openrouter.ai/docs/guides/features/structured-outputs)

### Exact price surface

The live endpoint pricing object is `{ "prompt": "0", "completion": "0", "discount": 0 }`. The model-level object likewise publishes prompt and completion as `"0"`. OpenRouter documents pricing values as USD per token/request/unit and says `"0"` means free. [Live Gemma endpoint API](https://openrouter.ai/api/v1/models/google/gemma-4-31b-it%3Afree/endpoints), [live Models API](https://openrouter.ai/api/v1/models), [Models API pricing schema](https://openrouter.ai/docs/guides/overview/models)

| Billable dimension                      | Live metadata                             | Conclusion for this repository                                   |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| Prompt                                  | `"0"`                                     | Exactly zero                                                     |
| Completion                              | `"0"`                                     | Exactly zero                                                     |
| Request                                 | Field absent                              | No separate per-request price is published                       |
| Image input                             | Supported, but `image` price field absent | No nonzero image SKU is published; this chat sends text only     |
| Audio                                   | Unsupported modality and field absent     | Not applicable                                                   |
| Web search / cache / internal reasoning | Fields absent                             | No separate price is published; do not enable paid tools/plugins |

For the current text-only chat, every applicable published model SKU is zero. The absent fields should not be rewritten as explicit numeric zeros in an audit: OpenRouter simply does not publish those SKUs for this endpoint. Retaining zero `max_price` ceilings for prompt, completion, request, image, and audio makes a future pricing change fail closed.

## Privacy

Gemma's only current free endpoint is Google AI Studio. OpenRouter's endpoint policy data says `training: false`, `trainingOpenRouter: false`, `retainsPrompts: true`, `retentionDays: 55`, `canPublish: false`, `sendClientIp: false`, and `requiresUserIDs: false`. The exact Gemma free endpoint is absent from OpenRouter's live ZDR endpoint list. Consequently, `provider.zdr: true` would leave Gemma with no eligible endpoint; `data_collection: "deny"` is also incompatible with the current retaining endpoint. [Gemma providers page](https://openrouter.ai/google/gemma-4-31b-it%3Afree/providers), [OpenRouter provider table](https://openrouter.ai/providers), [live ZDR endpoint API](https://openrouter.ai/api/v1/endpoints/zdr), [provider-routing privacy controls](https://openrouter.ai/docs/guides/routing/provider-selection)

OpenRouter itself says prompt/response content is not stored unless the account opts into input/output logging or OpenRouter use of inputs/outputs, although request metadata is retained. That policy does not override the upstream provider's 55-day retention. Do not send confidential visitor data through this Gemma endpoint. [OpenRouter data collection](https://openrouter.ai/docs/guides/privacy/data-collection), [provider logging](https://openrouter.ai/docs/guides/privacy/provider-logging/)

## Assessed free candidates

All three live endpoints publish prompt and completion prices of zero. The application allowlist retains only GLM and Gemma because both advertise JSON response-format support; Nemotron is excluded from runtime configuration. The comparison below uses the exact free endpoint APIs and the live Models API; availability and uptime can change.

| Model                                    | Current free endpoint | Context / max output | JSON capability                                      | Data policy                                                                             | OpenRouter intelligence index |
| ---------------------------------------- | --------------------- | -------------------: | ---------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------: |
| `z-ai/glm-5.2:free`                      | Decart (`decart/fp4`) |    256,000 / 256,000 | `response_format` + JSON-schema `structured_outputs` | ZDR; provider does not train                                                            |                          52.6 |
| `google/gemma-4-31b-it:free`             | Google AI Studio      |     262,144 / 32,768 | `response_format`; no schema enforcement             | No training; 55-day retention; not ZDR                                                  |                          29.7 |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | NVIDIA                |   1,000,000 / 65,536 | Neither JSON parameter advertised                    | NVIDIA warns that free-endpoint use is logged and used to improve its products; not ZDR |                          38.3 |

Sources: [GLM endpoint API](https://openrouter.ai/api/v1/models/z-ai/glm-5.2%3Afree/endpoints), [Gemma endpoint API](https://openrouter.ai/api/v1/models/google/gemma-4-31b-it%3Afree/endpoints), [Nemotron endpoint API](https://openrouter.ai/api/v1/models/nvidia/nemotron-3-ultra-550b-a55b%3Afree/endpoints), [Models API](https://openrouter.ai/api/v1/models), [ZDR endpoint API](https://openrouter.ai/api/v1/endpoints/zdr), [Nemotron free-endpoint notice](https://openrouter.ai/nvidia/nemotron-3-ultra-550b-a55b%3Afree/uptime).

## Zero-spend guardrails

To make the purchased balance unreachable from this chat path:

1. Allow only exact reviewed IDs ending in `:free`; do not use paid IDs, aliases, `openrouter/auto`, or a `models` fallback list containing a paid model.
2. Keep provider `max_price` at zero for prompt, completion, request, image, and audio. OpenRouter says `max_price` filters out providers above the ceiling. [Provider routing](https://openrouter.ai/docs/guides/routing/provider-selection)
3. Keep every entry in the OpenRouter `models` fallback list on the reviewed exact-free allowlist. Provider fallbacks may remain enabled because the zero-price ceiling and post-response cost verification still fail closed.
4. Send `response_format: { "type": "json_object" }` for Gemma and `require_parameters: true`; otherwise OpenRouter documents that unsupported parameters may be ignored. Continue local parsing and grounding validation because Gemma cannot enforce the schema. [Parameter enforcement](https://openrouter.ai/docs/guides/routing/provider-selection#requiring-providers-to-support-all-parameters)
5. Do not enable `:online`, web-search plugins/server tools, PDF OCR, image generation, or any other priced add-on. OpenRouter explicitly says web search can incur extra cost even with a free model. Also disable account/organization default plugins, which can apply to every API request without code changes. [Web-search pricing](https://openrouter.ai/docs/guides/features/plugins/web-search), [default plugin settings](https://openrouter.ai/docs/guides/features/plugins/overview)
6. Request usage metadata and require reported generation cost to equal exactly zero before accepting an answer. This detects policy drift after a call; the exact ID allowlist and price ceiling are the preventive controls.

With those controls and text-only requests, Gemma can be evaluated or selected without consuming the purchased credits. Its main tradeoffs are one-provider availability, weaker schema guarantees than GLM, and 55-day upstream retention.
