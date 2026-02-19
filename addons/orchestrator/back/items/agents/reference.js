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
        3. If no match exists → omit the field entirely
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
        structure: {
            type: 'object',
            description: 'Available data references (source:key → type and description)'
        }
    },
    output: {
        values: {
            type: 'object',
            description: 'Mapped references for each field'
        }
    }
});
