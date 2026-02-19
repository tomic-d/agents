# BRIEF — Divhunt Agents

*Product definition. This file locks after Phase 1.*

---

## What is this?

AI automation platform under the Divhunt brand (divhunt.com/agents). The user gets an AI that works for them — reads emails, notifies about what matters, automates routine tasks.

## Who is it for?

MVP: Anyone overwhelmed by email who misses important things.
Later: Developers who want to add AI automation to their apps/sites.

## What problem does it solve?

People receive hundreds of emails daily. Important things get buried. No one has time to read everything. AI does it for you and notifies you only about what matters, where you'll actually see it (WhatsApp/SMS/Slack).

## MVP — First version

**"AI that reads your emails and sends you a WhatsApp when something important arrives."**

Scope:
- Gmail connection (OAuth)
- AI agent that classifies emails by importance
- WhatsApp notification (Twilio / Meta Business API)
- Dashboard where user configures what "important" means to them
- Auth + billing (basic tier)

What is NOT in MVP:
- BYOA (Bring Your Own Agents)
- Marketplace
- Custom integrations
- "Reply on my behalf"

## Vision — Long-term

1. MVP → Email + WhatsApp notifications
2. Add channels → Slack, SMS, Telegram
3. Add actions → "reply", "forward", "create task"
4. Open the platform → BYOA, developers build custom agents
5. Marketplace → community agents, monetization
6. Ecosystem → divhunt.com/agents, /sites, /tools — shared auth, billing, collections

## Competition

| Competitor | What they do | How we're different |
|---|---|---|
| Zapier | Workflow automation, 5000+ integrations | Not AI-first, rule-based |
| n8n | Open-source workflow | Self-hosted, complex for non-developers |
| Make | Visual automation | Same as Zapier, not AI-native |
| Shortwave | AI email client | Email only, no cross-channel notifications |
| SaneBox | Email filtering | Rule-based, not AI, no WhatsApp |

Our edge: AI-first, cross-channel notifications, simplicity. You don't build a workflow — you tell AI what matters and it handles the rest.

## Brand

- Name: Divhunt Agents
- URL: divhunt.com/agents
- Under the Divhunt brand — existing user base
- Note: Legal relationship with Divhunt GmbH must be resolved before launch (Marko 20%, Hangama 10%)

## Timeline

- 2-3 months of intense work to MVP
- One person (Dejan), full-time focus
