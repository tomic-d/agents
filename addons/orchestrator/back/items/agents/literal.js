import agents from '#agents/load.js';

agents.Item({
    id: 'orchestrator-literal',
    name: 'Orchestrator Literal',
    description: 'Extracts literal values from goal text for unmatched fields',
    instructions: `
        Extract values for agent input fields from the goal text.

        These fields could not be found in any data source. Your job: read the goal
        and extract or derive the correct value for each field.

        RULES:
        1. Read the goal text carefully
        2. For each field, extract the value mentioned in the goal
        3. Match the expected type from the field schema
        4. If the goal does not contain a value for a field → use null

        OUTPUT FORMAT:
        { "properties": { "fieldName": value }, "conclusion": "Done: ..." }

        EXAMPLES:
        - Goal: "Show me 200 results", field "limit" (type: number) → { "properties": { "limit": 200 } }
        - Goal: "Research Vienna", field "topic" (type: string) → { "properties": { "topic": "Vienna" } }
        - Goal: "Analyze this", field "language" → { "properties": { "language": null } }
    `,
    tokens: 500,
    input: {
        agent: {
            type: 'object',
            description: 'Target agent (id, name, description, input schema)'
        },
        goal: {
            type: 'string',
            description: 'The orchestrator goal text'
        }
    },
    output: {
        properties: {
            type: 'object',
            description: 'Extracted values for each field'
        }
    }
});
