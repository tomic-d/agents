# ARCHITECTURE — Divhunt Agents

*Living technical overview. Updated alongside the code.*

---

## Status: Draft — awaiting Phase 1 finalization

Architecture will be defined after the brief is locked. Initial directions for discussion:

## Proposed Stack

- **Runtime:** Node.js (Divhunt Framework V2 as foundation)
- **Database:** PostgreSQL
- **Queue:** RabbitMQ (async job processing)
- **Cache:** Redis
- **AI:** OpenAI API / Anthropic API for email classification
- **Email:** Gmail API (OAuth 2.0)
- **Notifications:** Twilio (WhatsApp Business API)
- **Auth:** Custom (framework addon — tokens, sessions)
- **Billing:** Stripe
- **Frontend:** Framework V2 frontend (Proxy reactivity, directives)
- **Hosting:** TBD

## Key Decisions Pending

- [ ] Self-hosted vs cloud deployment?
- [ ] Divhunt Framework V2 as foundation or plain Node.js?
- [ ] Single monolith or split services from the start?
- [ ] Which LLM provider for classification? (cost vs quality)
- [ ] WhatsApp Business API vs Twilio vs alternative?
