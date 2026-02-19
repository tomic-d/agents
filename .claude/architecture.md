# ARCHITECTURE — Divhunt Agents

*Living technical overview. Updated alongside the code.*

---

## Status: Active — code exists, evolving

## Stack

- **Runtime:** Node.js + Divhunt Framework V2 (npm: `divhunt@^2.0.0`)
- **AI:** Proxied via `nue.tools.divhunt.com/api/run/ai-chat` (JSON response format)
- **Database:** PostgreSQL (planned)
- **Email:** Gmail API OAuth (planned)
- **Notifications:** WhatsApp Business API / Twilio (planned)
- **Auth/Billing:** TBD

## Project Structure

```
index.js                          — Entry point (HTTP server on port 3000)
package.json                      — Dependencies, import aliases (#agents/*, #orchestrator/*)
addons/
  agents/back/                    — AI agent runner addon
    addon.js                      — Addon definition (fields: id, name, instructions, input, output, etc.)
    load.js                       — Loader (registers functions)
    functions/
      parse.js                    — JSON parser for AI responses (sanitizes, extracts JSON)
      request.js                  — HTTP client for AI API (OpenAI-compatible, with retry)
    item/functions/
      run.js                      — Agent execution (prompt building, validation, lifecycle hooks)
  orchestrator/back/              — Multi-agent orchestration addon
    addon.js                      — Addon definition (fields: steps, agents, task, hooks)
    load.js                       — Loader (registers items + functions)
    items/agents/
      done.js                     — Checks if orchestration goal is achieved
      agent.js                    — Selects the next agent to execute
      goal.js                     — Writes a focused goal for the current step
      reference.js                — Maps unmatched fields to data references (structure keys)
      literal.js                  — Extracts literal values from goal/history for unmatched fields
      conclusion.js               — Writes a one-sentence summary of what an agent produced
    item/functions/
      run.js                      — Orchestration state machine loop
      state/
        done.js                   — Done check state handler
        agent.js                  — Agent selection state handler
        goal.js                   — Goal writing state handler
        input.js                  — Input pipeline (programmatic → reference → literal → default)
        execute.js                — Agent execution state handler
        conclusion.js             — Conclusion writing state handler
tests/
  agents/                         — Single agent tests
  orchestrators/                  — Multi-agent orchestrator tests (levels 1-6)
```

## Import Aliases (package.json)

- `#agents/*` → `./addons/agents/back/*`
- `#orchestrator/*` → `./addons/orchestrator/back/*`
- `divhunt` → npm package

## Agent Flow

1. Define agent with `agents.Item({ id, instructions, input, output })`
2. Run with `agent.Fn('run', goal, data)`
3. Builds prompt (system + user), sends to AI API, parses JSON, validates output

## Orchestrator Flow

1. Define orchestrator with `orchestrator.Item({ id, task, steps, agents, input })`
2. Run with `orch.Fn('run', input)`
3. State machine loop per step: **done → agent → goal → input → execute → conclusion**
4. `state.agents` — enriched array of `{id, description}` (null agents filtered)
5. `state.history` — array of `{step, agent, goal, conclusion, input, output}` per step
6. Loop ends when done agent returns `true` or max steps reached

## State Machine Steps

1. **Done** — checks task + conclusions + available agents list → `true`/`false`
2. **Agent** — selects next agent from available list based on task and history
3. **Goal** — writes focused goal for selected agent (max 15 words)
4. **Input** — 4-step pipeline resolves agent input fields
5. **Execute** — runs the selected agent with resolved input
6. **Conclusion** — writes one-sentence summary of what agent produced

## Input Pipeline (4-step)

1. **Programmatic** — exact field name match across history outputs (newest-first) then orchestrator input
2. **Reference agent** — receives structure map (`agent:key` format, no values), maps unmatched fields to data sources
3. **Literal agent** — reads goal text + history conclusions, extracts values for remaining unmatched fields
4. **Schema default** — `definition.value` as last fallback
5. `unmatched` array filtered after each step to prevent overwrites
6. Result validated against agent input schema via `DataDefine`

## Schema Shape Format

Consistent across all orchestrator agents: `"key": "*type - description"` (prefix `*` for required fields)

## Key Decisions Pending

- [ ] Self-hosted vs cloud deployment?
- [ ] Single monolith or split services from the start?
- [ ] Per-agent model config (`model: {endpoint, api, name}`)
- [ ] WhatsApp Business API vs Twilio vs alternative?
