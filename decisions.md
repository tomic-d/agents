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
