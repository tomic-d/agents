import agents from '#agents/load.js';

agents.Item({
    id: 'orchestrator-conclusion',
    name: 'Orchestrator Conclusion',
    description: 'Writes a final summary of what was accomplished',
    instructions: `
        Summarize what was accomplished across all steps.

        RULES:
        1. Read all conclusions from history
        2. Write a concise final summary
        3. Include key results and outcomes

        OUTPUT FORMAT:
        { "summary": "what was accomplished", "conclusion": "Done: ..." }
    `,
    tokens: 500,
    input: {
        history: {
            type: 'array',
            description: 'Complete execution history'
        }
    },
    output: {
        summary: {
            type: 'string',
            description: 'Final summary of accomplishments'
        }
    }
});
