# AI provider

FocusFlow's task breakdown calls an LLM through a single server function
(`src/server/ai.functions.ts → breakDownTask`). The provider is selected at
runtime by env vars — no client code changes when switching.

## Default: Lovable AI Gateway

- Zero config. `LOVABLE_API_KEY` is auto-provisioned by Lovable Cloud.
- Model: `google/gemini-3-flash-preview`.
- Endpoint: `https://ai.gateway.lovable.dev/v1/chat/completions` (OpenAI-compatible).

## Escape hatch: local Ollama (dev only)

Set these env vars **on the machine running the dev server**:

```
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma2:2b   # or gemma4:e4b once published
```

Then `ollama serve` + `ollama pull <model>` and restart the dev server.

### Caveats

- **Local only.** Deployed previews on Lovable run in an edge worker that
  cannot reach your laptop. The Ollama branch is a personal-dev affordance.
- If running the dev server inside Docker, use `http://host.docker.internal:11434`.
- The prompt and tool-call schema are identical for both providers, so output
  shape stays the same.

## Adding more providers

Edit `callAI()` in `src/server/ai.functions.ts`. Same input → same `{ steps: string[] }`
output, regardless of provider.
