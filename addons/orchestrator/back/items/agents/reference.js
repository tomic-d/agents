import agents from '#agents/load.js';

agents.Item({
    id: 'orchestrator-reference',
    name: 'Orchestrator Reference',
    description: 'Maps unmatched fields to data references using structure keys',
    instructions: `
        Match agent input fields to available references from previous steps.

        You receive:
        - goal: what this step is trying to accomplish
        - fields: what the agent needs (each has type and description)
        - references: available data from previous steps, keyed as agent:step:field (each has type, description, and a preview of the actual data)
        - history: what happened so far (step, agent, conclusion)
        - step: current step number being resolved

        The preview field is ONLY for context — it shows a snippet of the actual data so you can understand what each reference contains. NEVER copy preview content into your output.

        Your output must contain ONLY reference keys (like revise:4:description or research:1:features). Nothing else.

        PROCESS:
        1. Read the goal to understand what this step is trying to accomplish
        2. Read each field's type AND description
        3. For each reference, read its type, description, AND preview to understand what it contains
        4. Match by type first, then by goal context, description and preview relevance
        5. Use history to understand the execution flow

        RULES:
        1. Type must match exactly — never map an array reference to a string field
        2. Description and preview relevance decides between same-type candidates
        3. When the same agent ran multiple times, prefer the highest step number closest to the current step
        4. Output ONLY reference keys (e.g. revise:4:description) — NEVER output preview content or any other text
        5. If no good match exists → omit the field entirely
        6. Only map references that are clearly relevant — when in doubt, omit
        7. VERIFY: check the preview — would this data actually work as input for the field? If the preview content does not represent what the field needs, omit
    `,
    tokens: 500,
    input: {
        goal: {
            type: 'string',
            description: 'Current step goal — what this agent is trying to accomplish'
        },
        step: {
            type: 'number',
            description: 'Current step number being resolved'
        },
        agent: {
            type: 'object',
            description: 'Target agent (id and description)'
        },
        fields: {
            type: 'object',
            description: 'Unmatched input fields with their schema'
        },
        references: {
            type: 'object',
            description: 'Available references from previous steps (agent:step:field → schema)'
        },
        history: {
            type: 'array',
            description: 'Execution history (step, agent, conclusion per step)'
        }
    },
    output: {
        values: {
            type: 'object',
            description: 'Mapped references for each field'
        }
    }
});
