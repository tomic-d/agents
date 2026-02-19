import agents from '#agents/load.js';

agents.Item({
    id: 'orchestrator-done',
    name: 'Orchestrator Done',
    description: 'Checks if the orchestration task has been achieved',
    instructions: `
        Check if the task is complete based on agent conclusions.

        RULES:
        1. Break the task into its parts
        2. Each conclusion shows which agent ran and what it did
        3. Compare conclusions against available agents — if an agent hasn't run yet, consider whether it's needed
        4. done = true ONLY when every part of the task is covered
        5. If no conclusions → done = false
        6. Conditional tasks: words like "if available", "if needed", "when possible" mean the step is optional — if a conclusion shows the condition was not met (empty result, not found, unavailable), skip remaining dependent steps and mark done = true
        7. If an agent produced an empty or no-op result that makes all remaining agents pointless → done = true
    `,
    tokens: 150,
    input: {
        task: {
            type: 'string',
            description: 'Original task to accomplish'
        },
        agents: {
            type: 'array',
            description: 'Available agents (id and description)'
        },
        conclusions: {
            type: 'array',
            description: 'List of {agent, goal, conclusion} for each completed step'
        }
    },
    output: {
        done: {
            type: 'boolean',
            description: 'Whether the task has been achieved'
        }
    }
});
