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
      request.js                  — HTTP client for AI API (with retry)
    item/functions/
      run.js                      — Agent execution (prompt building, validation, lifecycle hooks)
  orchestrator/back/              — Multi-agent orchestration addon
    addon.js                      — Addon definition (fields: steps, agents, status, state, hooks)
    load.js                       — Loader (registers items + functions)
    items/agents/
      planner.js                  — AI agent that decides which agent to run next
      properties.js               — Reference agent: maps unmatched fields to data keys (structure only)
      literal.js                  — Literal agent: extracts values from goal text
    item/functions/
      run.js                      — Orchestration loop (plan → properties → execute → repeat)
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

1. Define orchestrator with `orchestrator.Item({ id, steps, agents, hooks })`
2. Run with `orch.Fn('run', goal, data)`
3. State: `state.input` (initial data), `state.output` (agent results by ID)
4. Loop: planner picks agent → properties pipeline → agent executes → result stored in `state.output[agent-id]`
5. Planner decides when goal is achieved

## Properties Pipeline (4-step)

1. **Programmatic** — exact field name match across `state.output` (newest-first) then `state.input`
2. **Reference agent** — receives structure map (key names only, no values), returns `@key.path` references for semantic mismatches
3. **Literal agent** — receives goal text, extracts values mentioned in goal for remaining unmatched fields
4. **Schema default** — `definition.value` as last fallback
5. Result validated against agent input schema via `DataDefine`

## Key Decisions Pending

- [ ] Self-hosted vs cloud deployment?
- [ ] Single monolith or split services from the start?
- [ ] Which LLM provider for production? (cost vs quality)
- [ ] WhatsApp Business API vs Twilio vs alternative?
