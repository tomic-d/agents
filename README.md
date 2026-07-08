# Agents

**A multi-agent orchestrator that trusts the model as little as possible — and is faster, cheaper, and more predictable because of it.**

Most agent frameworks hand every decision to the LLM: which step comes next, what the inputs are, when the job is done. That's slow, expensive, and non-deterministic — run the same task twice and you can get two different paths.

This orchestrator flips it. A deterministic state machine runs the show, and the model is only called for the one thing it's actually good at: a genuine judgment call. Everything a rule can decide stays a rule.

Built from scratch by [Dejan Tomic](https://github.com/tomic-d), on my own framework [@onetype/framework](https://www.npmjs.com/package/@onetype/framework). It started life as the AI module inside that framework and was extracted into its own repository once it grew into a standalone system.

---

## Show me

Define an agent — what it does, and the exact shape of its input and output:

```js
agents.Item({
    id: 'classify',
    name: 'Email Classifier',
    description: 'Classifies an email as important or not',
    instructions: 'Classify the email. Return priority (high/medium/low) and category.',
    input: {
        subject: { type: 'string', required: true, description: 'Email subject line' },
        body:    { type: 'string', required: true, description: 'Email body text' }
    },
    output: {
        priority: { type: 'string', description: 'high, medium, or low' },
        category: { type: 'string', description: 'newsletter, personal, work, other' }
    }
});
```

Hand the orchestrator a task, some data, and the agents it's allowed to use. It plans the steps, resolves each agent's inputs, runs them, and decides when the goal is met:

```js
orchestrator.Item({
    id: 'triage',
    task: 'Classify this email and route it',
    data: {
        subject: 'Invoice #4521 — Payment overdue',
        body: 'Your invoice of 2,450 EUR is 15 days overdue...'
    },
    steps: 3,
    agents: ['classify', 'route']
});

const state = await orchestrator.ItemGet('triage').Fn('run');
```

You never wire the agents together by hand. The orchestrator works out which agent runs next and where each of its inputs comes from.

---

## The core idea: layered input resolution

When one agent's output has to become the next agent's input, most systems ask the model to figure it out. Here, that resolution runs in layers, and the model is the *last* resort, not the first:

1. **Exact match** — if the value is already there, use it. No model.
2. **Model** — only for genuinely ambiguous fields, and only with clear candidates to choose between.
3. **Literal extraction** — pull it straight from the task text.
4. **Schema defaults** — fall back to what the schema says.

**Deterministic first, model last.** The result: fewer API calls, lower cost, and the same task resolves the same way every time.

## How it's built

Three self-contained addons:

| Addon | Responsibility |
|---|---|
| **agents** | Defines an agent — a description, an input schema, and what it can do. |
| **orchestrator** | The state machine. Loops: is the goal met? pick the next agent, resolve its inputs, run it, record the result, repeat. |
| **providers** | Pluggable model providers behind one interface — the orchestrator never cares which model actually runs a step. |

The loop lives in `addons/orchestrator/back/item/functions/run.js`.
Input resolution — the heart of it — lives in `addons/orchestrator/back/item/functions/state/input.js`.

## Why it matters

Reliability is the hard part of agent systems, not capability. A system you can't predict is a system you can't ship. By keeping the model out of the loop wherever a rule will do, this stays fast and repeatable — the properties you actually need in production.

## Run

```bash
npm install
node index.js
```

Starts an HTTP API on `http://localhost:3000`. Requires Node.js >= 18.

## License

[MIT](LICENSE)
