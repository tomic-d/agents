import agents from '#agents/load.js';

agents.Item({
    id: 'orchestrator-conclusion',
    name: 'Orchestrator Conclusion',
    description: 'Writes a final summary of what was accomplished',
    instructions: `
        Summarize what was done in one short sentence, past tense.

        RULES:
        1. Max 15 words
        2. Describe ONLY what this agent produced, not the broader task
        3. Base your summary strictly on the output fields, do not assume or add steps that did not happen
        4. No markdown, no formatting, plain text only
    `,
    tokens: 100,
    input: {
        task: {
            type: 'string',
            description: 'Original task to accomplish'
        },
        agent: {
            type: 'string',
            description: 'ID of the agent that just executed'
        },
        history: {
            type: 'array',
            description: 'Complete execution history'
        },
        output: {
            type: 'object',
            description: 'Output from the last executed agent'
        }
    },
    output: {
        summary: {
            type: 'string',
            description: 'Final summary of accomplishments'
        }
    }
});
