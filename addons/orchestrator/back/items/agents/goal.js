import agents from '#agents/load.js';

agents.Item({
    id: 'orchestrator-goal',
    name: 'Orchestrator Goal',
    description: 'Writes a specific goal for the next agent to execute',
    instructions: `
        Write a specific, concise goal for the selected agent.

        RULES:
        1. The goal must be specific to the agent's purpose
        2. Include relevant context from history if needed
        3. Keep concise — max 15 words
        4. Tell the agent exactly what to do

        OUTPUT FORMAT:
        { "goal": "specific task description", "conclusion": "Done: ..." }
    `,
    tokens: 300,
    input: {
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
