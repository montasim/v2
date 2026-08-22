# Chat vector search

The portfolio assistant uses Gemini embeddings and Neon Postgres with the
`pgvector` extension. Gemini and Groq still generate the final answer; Neon
selects the small evidence set they are allowed to use.

## One-time setup

1. Copy the pooled Neon connection string from **Neon Console → Project →
   Connect**.
2. Configure the local environment:

   ```dotenv
   DATABASE_URL=postgresql://...neon.tech/...?...sslmode=require
   GOOGLE_GENERATIVE_AI_API_KEY=...
   GROQ_API_KEY=...
   ```

3. Create the extension and evidence table:

   ```bash
   pnpm db:migrate
   ```

   Migration `0005_superb_proteus.sql` runs
   `CREATE EXTENSION IF NOT EXISTS vector`, so no separate Neon integration or
   database is required.

4. Embed and store the portfolio evidence:

   ```bash
   pnpm db:index-chat
   ```

The initial index contains a few hundred chunks. The indexer submits at most 75
documents per minute to remain below Gemini's free-tier embedding rate limit.
It writes each completed batch immediately. A retry resumes with only missing
or changed documents.

## Updating the index

Run `pnpm db:index-chat` after changing portfolio data, blogs, or case studies.
Each document has a content hash, so unchanged content does not consume another
embedding request. Documents removed from the source catalogs are also removed
from Neon.

## Runtime behavior

Each chat question generates one 768-dimension query embedding. Neon performs
exact cosine search plus Postgres full-text ranking. Exact search is intentional:
the current corpus is small enough that an approximate HNSW index would add
storage and maintenance without a useful latency improvement.

If Gemini embeddings or Neon are temporarily unavailable, chat falls back to
the existing deterministic evidence selector. If search runs successfully but
finds no sufficiently relevant evidence, the assistant receives an explicit
evidence gap and no citation.

## Deployment

Set `DATABASE_URL`, `GOOGLE_GENERATIVE_AI_API_KEY`, and `GROQ_API_KEY` in the
hosting provider. Run migrations and indexing against the production
`DATABASE_URL` before deploying a build that expects vector retrieval.

The embedding model and dimensions must match between indexing and runtime.
Changing either requires re-embedding every document.
