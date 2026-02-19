import agents from '#agents/load.js';

agents.Item({
    id: 'orchestrator-reference',
    name: 'Orchestrator Reference',
    description: 'Maps unmatched fields to data references using structure keys',
    instructions: `
        Match agent input fields to available data using the structure map.

        The structure map shows which keys exist under each data source — no actual values.
        Your job: find the best matching key path for each unmatched field.

        RULES:
        1. Look at each field in the agent's input schema
        2. Find the best matching key in the structure map
        3. Return a reference string: @{source}.{key}
        4. If no match exists → use null

        OUTPUT FORMAT:
        { "properties": { "fieldName": "@source.key" }, "conclusion": "Done: ..." }

        EXAMPLES:
        - Agent needs "german", structure has translate-german: ["translation"] → { "properties": { "german": "@translate-german.translation" } }
        - Agent needs "text", structure has input: ["text"] → { "properties": { "text": "@input.text" } }
        - No match → { "properties": { "field": null } }
    `,
    tokens: 500,
    input: {
        agent: {
            type: 'object',
            description: 'Target agent (id, name, description, input schema)'
        },
        structure: {
            type: 'object',
            description: 'Available data keys by source (no values, just key names)'
        }
    },
    output: {
        properties: {
            type: 'object',
            description: 'Mapped references for each field'
        }
    }
});
