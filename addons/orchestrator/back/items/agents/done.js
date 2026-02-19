import agents from '#agents/load.js';

agents.Item({
    id: 'orchestrator-done',
    name: 'Orchestrator Done',
    description: 'Checks if the orchestration goal has been achieved',
    instructions: `
        Check if the task is complete based on agent conclusions.

        RULES:
        1. Break the task into its parts
        2. Each conclusion shows which agent ran and what it did
        3. done = true ONLY when every part of the task is covered
        4. If no conclusions → done = false
    `,
    tokens: 150,
    input: {
        task: {
            type: 'string',
            description: 'Original task to accomplish'
        },
        conclusions: {
            type: 'array',
            description: 'List of {agent, conclusion} pairs for each completed step'
        }
    },
    output: {
        done: {
            type: 'boolean',
            description: 'Whether the goal has been achieved'
        }
    }
});
