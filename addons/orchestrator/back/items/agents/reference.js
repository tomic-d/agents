import agents from '#agents/load.js';

agents.Item({
    id: 'orchestrator-reference',
    name: 'Orchestrator Reference',
    description: 'Maps unmatched fields to data references using structure keys',
    instructions: `
        Match agent input fields to available references.

        The structure map has references as keys (e.g. search:results) with their type and description.
        Pick the best matching reference for each unmatched field.

        RULES:
        1. Compare field type and description with available references
        2. Copy the reference key exactly as the value
        3. If no match exists → use null
    `,
    tokens: 500,
    input: {
        task: {
            type: 'string',
            description: 'Original task to accomplish'
        },
        agent: {
            type: 'object',
            description: 'Target agent (id, name, description, input schema)'
        },
        structure: {
            type: 'object',
            description: 'Available data keys by source with type and description (no actual values)'
        }
    },
    output: {
        values: {
            type: 'object',
            description: 'Mapped references for each field'
        }
    }
});
