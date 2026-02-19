import agents from '#agents/load.js';

agents.Item({
    id: 'orchestrator-literal',
    name: 'Orchestrator Literal',
    description: 'Extracts literal values from goal text for unmatched fields',
    instructions: `
        Extract values for agent input fields from the goal text and execution history.

        These fields could not be found in any data source. Your job: read the goal
        and history to extract or derive the correct value for each field.

        RULES:
        1. Read the goal text and history carefully
        2. History conclusions contain key information from previous steps
        3. For each field, extract the value from goal or history
        4. Match the expected type from the field schema
        5. If no value can be found → omit the field entirely
    `,
    tokens: 500,
    input: {
        task: {
            type: 'string',
            description: 'Original task to accomplish'
        },
        agent: {
            type: 'object',
            description: 'Target agent (id and description)'
        },
        fields: {
            type: 'object',
            description: 'Unmatched input fields (field name → type and description)'
        },
        goal: {
            type: 'string',
            description: 'Current step goal'
        },
        history: {
            type: 'array',
            description: 'Execution history (agent, goal, conclusion per step)'
        }
    },
    output: {
        values: {
            type: 'object',
            description: 'Extracted values for each field'
        }
    }
});
