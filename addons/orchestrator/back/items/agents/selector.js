import agents from '#agents/load.js';

agents.Item({
    id: 'orchestrator-selector',
    name: 'Orchestrator Selector',
    description: 'Selects the next agent to execute',
    instructions: `
        Select the best next agent from the available list.

        RULES:
        1. Read history to understand what has been done
        2. Pick the agent that should logically execute next
        3. Agent ID must be an EXACT match from the agents list
        4. Consider dependencies — some agents need output from others

        OUTPUT FORMAT:
        { "agent": "exact-agent-id", "conclusion": "Done: ..." }
    `,
    tokens: 300,
    input: {
        history: {
            type: 'array',
            description: 'Execution history with agent and conclusion for each step'
        },
        agents: {
            type: 'array',
            description: 'Available agents to choose from'
        }
    },
    output: {
        agent: {
            type: 'string',
            description: 'ID of the next agent to execute'
        }
    }
});
