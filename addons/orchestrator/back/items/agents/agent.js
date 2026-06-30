import agents from '#agents/load.js';

agents.Item({
    id: 'orchestrator-agent',
    name: 'Orchestrator Agent',
    description: 'Selects the next agent to execute',
    instructions: `
        Select the best next agent from the available list.

        RULES:
        1. Read history to understand what has been done
        2. Pick the agent that should logically execute next
        3. Agent ID must be an EXACT match from the agents list
        4. Consider dependencies — some agents need output from others
    `,
    tokens: 150,
    input: {
        task: {
            type: 'string',
            description: 'Original task to accomplish'
        },
        history: {
            type: 'array',
            description: 'Execution history with agent ID and output for each step'
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
