# Divhunt Agents

Open-source AI automation platform. Build, connect, and orchestrate intelligent agents.

## What is this?

A framework for building multi-agent AI pipelines. Define agents with instructions, inputs, and outputs — the orchestrator handles the rest: agent selection, input resolution, execution, and task completion.

Works with local models (Ollama) and cloud APIs. The orchestrator itself runs on small models (24B) — no expensive API calls needed for coordination.

## Quick Start

```bash
npm install
node index.js
```

## Architecture

### Addons

- **agents** — Define AI agents with instructions, input/output schemas, context functions, and callbacks
- **orchestrator** — State machine that coordinates agents: selects the next agent, writes goals, resolves inputs, executes, and summarizes
- **providers** — AI provider abstraction (Ollama, Nue) with hook-based format normalization

### Orchestrator Loop

```
while not done:
    done?        → check if task is complete
    agent?       → select next agent
    goal?        → write focused goal for this step
    input?       → resolve input fields (programmatic → reference → literal → defaults)
    execute      → run the agent
    conclusion   → summarize what happened
```

### Input Resolution Pipeline

1. **Programmatic** — regex match field names against output pool, resolve if exactly 1 match
2. **Reference** — AI maps ambiguous fields to `agent:step:field` keys with previews
3. **Literal** — AI extracts values from task text and history
4. **Defaults** — schema default values

## Examples

### News Scanner (`tests/examples/news.js`)

8-agent pipeline: gate, scrape, scan, merge, enrich, summarize, translate, notify. Tests URL ambiguity (`url` vs `url2`), cross-reference resolution (`feed` → `items`), and Slack webhook delivery.

### Book Analysis (`tests/examples/book.js`)

4-agent pipeline: load, split, analyze (x N), synthesize. Fetches a book from Project Gutenberg, splits into chunks, analyzes each independently, then synthesizes a final answer. Tests fan-out pattern (same agent running N times), dynamic output keys, and context-based aggregation.

## Project Structure

```
addons/
  agents/back/           — Agent runner, parser, addon definition
  orchestrator/back/     — State machine, 6 state handlers, 6 built-in agents
  providers/back/        — Provider abstraction (Ollama, Nue)
tests/
  orchestrators/         — Level 1-7 progression tests
  examples/              — Advanced integration tests (news, book)
```

## License

MIT
