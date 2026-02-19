# TASKS — Divhunt Agents

*Active tasks. Current phase only, not a wishlist.*

---

## Phase 1: Planning

- [x] Create project structure (CLAUDE.md + files)
- [x] Finalize brief
- [x] Define architecture — initial draft with code structure
- [ ] Resolve legal relationship with Divhunt GmbH (Marko/Hangama)

## Phase 2: MVP Build

- [x] Set up entry point (index.js + HTTP server)
- [x] Build agents addon (definition, run, parse, request)
- [x] Build orchestrator addon (planner, properties, run loop)
- [x] Add import aliases (#agents/*, #orchestrator/*)
- [x] Fix orchestrator properties mapping (hybrid: programmatic + AI fallback)
- [x] Rewrite orchestrator into modular state machine (6 agents, state/ handlers)
- [x] Fix input pipeline (unmatched filtering, agent+fields separation)
- [x] Done agent receives available agents list
- [x] All 6 test levels passing (1-6 agents, thinking model)
- [ ] Per-agent model config (`model: {endpoint, api, name}`)
- [ ] Research Gmail API (OAuth flow, rate limits, pricing)
- [ ] Research WhatsApp Business API / Twilio (pricing, approval process)
- [ ] Research LLM options for email classification (cost per call, quality)
- [ ] Define pricing model (free tier? how many emails? how many notifications?)
- [ ] Build email reader agent (Gmail OAuth + classification)
- [ ] Build notification agent (WhatsApp via Twilio)
- [ ] API endpoints (auth, settings, agent status)
- [ ] Dashboard (user configures what "important" means)

## Later (not now)

- BYOA system
- Marketplace
- Additional channels (Slack, SMS, Telegram)
- "Reply on my behalf" agent
- Calendar parsing
- Ecosystem (sites, tools)
