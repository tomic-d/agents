import agents from '#agents/load.js';

agents.Item({
    id: 'orchestrator-goal',
    name: 'Orchestrator Goal',
    description: 'Writes a specific goal for the next agent to execute',
    instructions: `
        Write a short goal for the selected agent.

        RULES:
        1. Max 15 words
        2. Preserve concrete values — names, topics, numbers
        3. No markdown, no formatting, plain text only
    `,
    tokens: 100,
    input: {
        task: {
            type: 'string',
            description: 'Original task to accomplish'
        },
        agent: {
            type: 'object',
            description: 'Selected agent (id, name, description)'
        },
        history: {
            type: 'array',
            description: 'Execution history for context'
        }
    },
    output: {
        goal: {
            type: 'string',
            description: 'Specific goal for the agent'
        }
    }
});
