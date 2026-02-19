# DECISIONS — Divhunt Agents

*Every decision with reasoning. Never delete, only append.*

---

## D001 — Brand: Divhunt Agents, not a new brand
**Date:** 2026-02-18
**Decision:** Product goes under the Divhunt brand (divhunt.com/agents)
**Reason:** Divhunt has an existing user base, domain is on Dejan's personal account, faster start
**Rejected alternatives:**
- New brand — requires time for brand building, no existing users
- iamdejan.com/agents — sounds like a side project, not a product
**Risk:** Marko (20%) and Hangama (10%) hold shares in Divhunt GmbH. Legal relationship must be resolved before launch.
**Action:** Talk to Stefan and legally separate Agents from Divhunt GmbH.

---

## D002 — MVP: Email reader + WhatsApp notifications
**Date:** 2026-02-18
**Decision:** First version is "AI reads your emails, sends WhatsApp when something important arrives"
**Reason:** Concrete problem everyone understands in 5 seconds. Small scope, fast validation.
**Rejected alternatives:**
- BYOA marketplace — chicken-and-egg problem, too big for one person
- Internal tools builder — less competition but smaller market
- Backend-as-a-Service — Supabase too strong as a competitor
**Context:** Dejan has 2-3 months for MVP. Scope must be brutally small.

---

## D003 — Priority: Product before job
**Date:** 2026-02-18
**Decision:** Focus on launching a product instead of job search
**Reason:** Dejan wants to build his own product. Has a freelance project (25k EUR) as runway.
**Risk:** No stable income. Third surgery (25k EUR) is pending. If the product doesn't gain traction in 3 months, situation becomes difficult.
**Context:** Divhunt experience showed that tech is the easy part, distribution is hard. This time scope must stay small.

---

## D004 — Methodology: AI-managed project files
**Date:** 2026-02-18
**Decision:** Use CLAUDE.md + structured files (brief, architecture, decisions, tasks, progress) for project management
**Reason:** System tested on the iamdejan.com project — it works. AI maintains context across sessions, tracks decisions, protects scope.
**Context:** This system will serve as a template for all future projects.

---

## D005 — Open source from day 1
**Date:** 2026-02-19
**Decision:** Repository is public from the start. `tomic-d/agents`, MIT license.
**Reason:** Public portfolio is more valuable than code secrecy. A well-architected open-source project proves capability better than any CV. If the product fails commercially, the portfolio alone can land a 150-200k EUR/year position.
**Rejected alternatives:**
- Private repo, open later — delays portfolio building, no community benefit early on
**Context:** Dejan already has the framework on GitHub. Adding Agents creates a portfolio that 99% of developers can't match: full-stack framework + AI orchestrator + production SaaS. Worst case: great portfolio. Best case: great portfolio + revenue + community.

---

## D006 — Divhunt Framework V2 as foundation
**Date:** 2026-02-19
**Decision:** Use Divhunt Framework V2 via npm (`divhunt@^2.0.0`) as the project foundation.
**Reason:** Addon system maps perfectly to the agent/orchestrator architecture. Built-in HTTP server, data validation (DataDefine), command system. No need to reinvent.
**Rejected alternatives:**
- Plain Node.js + Express — more setup, no addon abstraction, would duplicate framework capabilities
**Context:** Framework is Dejan's own creation, deep familiarity. Agents project proves the framework works for real products.

---

## D007 — Extract parse and request as standalone functions
**Date:** 2026-02-19
**Decision:** Move `parse` (JSON sanitizer) and `request` (AI API call) out of `item.run` into separate `agents.Fn()` functions.
**Reason:** Both are pure utilities with no agent context dependency. Cleaner separation, reusable, easier to test.
**Rejected alternatives:**
- Keep everything in item.run — works but 270+ line function, harder to read
**Context:** Orchestrator methods were NOT extracted because they all depend on shared state/item context.

---

## D008 — Import aliases for addon paths
**Date:** 2026-02-19
**Decision:** Use Node.js subpath imports (`#agents/*`, `#orchestrator/*`) defined in package.json instead of relative paths.
**Reason:** Cleaner imports across the project. `#agents/load.js` instead of `../../../../agents/back/load.js`.
**Context:** Follows the same pattern Divhunt Framework uses internally.

---

## D009 — Orchestrator initial data under `input` key
**Date:** 2026-02-19
**Decision:** Initial data passed to orchestrator stored as `state.data.input` instead of spread on root.
**Reason:** Consistent with how agent outputs are stored (`state.data[agent-id]`). Properties agent can reference initial data as `@input.topic` using the same `@{key}.{path}` pattern as `@research.facts`.
**Rejected alternatives:**
- Spread on root (`state.data = { ...data }`) — breaks the `@{key}.{path}` reference pattern, properties agent can't map it
**Status:** Implemented. Superseded by D010 hybrid approach.

---

## D010 — Hybrid properties mapping (programmatic + AI fallback)
**Date:** 2026-02-19
**Decision:** Split properties mapping into two phases: (1) programmatic name-matching first, (2) AI fallback only for unmatched fields.
**Reason:** Ministral 14B (nue.tools) is unreliable for full properties mapping — fails on number types (test 4), sometimes returns empty objects. Programmatic matching handles 80%+ of cases (exact field name match across state data). AI only needs to handle semantic mismatches (e.g. `german` → `translate-german.translation`) and goal/context extraction.
**Rejected alternatives:**
- Pure AI mapping — unreliable on small models, overkill for exact name matches
- Pure programmatic mapping — can't handle semantic mismatches or context-derived values
**Context:** Tested across 5 scenarios. Tests 1, 3, 4 (exact name matches) work programmatically. Test 2 (semantic mapping) needs AI. Hybrid gives reliability where possible, AI where needed.
**Status:** Superseded by D012 (split into reference + literal agents).

---

## D011 — Separate state.input and state.output
**Date:** 2026-02-19
**Decision:** Replace flat `state.data` with `state.input` (initial data) and `state.output` (agent results).
**Reason:** Flat structure risked key collisions — an agent with `id: 'input'` would overwrite initial data. Separating eliminates collision entirely.
**Rejected alternatives:**
- Keep flat structure with reserved key validation — fragile, error-prone

---

## D012 — Split properties into reference + literal agents
**Date:** 2026-02-19
**Decision:** Replace single properties agent with 4-step pipeline: (1) programmatic name-match, (2) reference agent for semantic key mapping, (3) literal agent for goal extraction, (4) schema `value` as default fallback.
**Reason:** Each AI agent does one focused task instead of two mixed tasks. Reference agent receives only structure (key names, no values) — fewer tokens, no data mutation risk. Literal agent reads goal text only. Schema defaults moved to last position so goal values can override them.
**Rejected alternatives:**
- Single combined agent — mixed instructions, less reliable on small models
- Two agents without programmatic — unnecessary AI calls for exact name matches

---

## D013 — Modular state machine orchestrator
**Date:** 2026-02-19
**Decision:** Rewrite orchestrator from monolithic planner loop into modular state machine with 6 focused agents: done, agent, goal, reference, literal, conclusion. Each step in its own file under `state/`.
**Reason:** Single planner agent doing everything (agent selection + goal writing + completion check) was unreliable on small models. Splitting into focused agents with clear instructions gives better results.
**Rejected alternatives:**
- Single planner agent — too many responsibilities, small models confused
- Fewer agents (combine done+agent) — tested, worse results

---

## D014 — Separate agent context and fields params
**Date:** 2026-02-19
**Decision:** Reference and literal agents receive two separate params: `agent: {id, description}` for context and `fields: {...}` for work items, instead of a single combined `agent` param.
**Reason:** Small models nested output values under an "agent" key when the param was named "agent" and contained both context and field definitions. Separating eliminates confusion.
**Rejected alternatives:**
- Rename single param to "target" — still mixes concerns

---

## D015 — Done agent receives available agents list
**Date:** 2026-02-19
**Decision:** Pass `state.agents` (array of `{id, description}`) to the done agent alongside task and conclusions.
**Reason:** Without seeing available agents, done agent would mark task complete after writing HTML even though CSS and combine agents hadn't run. With the agents list, it can check which agents are available but unused.
**Rejected alternatives:**
- Require explicit steps in task text — puts burden on user, fragile

---

## D016 — Flat reference format (agent:key)
**Date:** 2026-02-19
**Decision:** Use flat `agent:key` format for data references instead of nested `@agent.key` notation.
**Reason:** Simpler parsing (single split on `:`), consistent with structure map keys. Small models handle it better.
**Rejected alternatives:**
- `@agent.key` notation — requires regex parsing, more complex for small models

---

## D017 — Thinking model for orchestrator, fast model for workers
**Date:** 2026-02-19
**Decision:** Use thinking/reasoning model (e.g. qwen3-next 80b) for orchestrator agents, fast model for user-defined worker agents.
**Reason:** Orchestrator agents (done, agent, goal, reference, literal, conclusion) need reasoning to make correct decisions. Worker agents (search, translate, sentiment) do concrete tasks where speed matters more. Tested: 14B model fails on 4+ agent pipelines, thinking 80B model passes all 6 levels cleanly.
**Context:** Per-agent model config planned as next feature.
