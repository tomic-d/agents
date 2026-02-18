import divhunt from 'divhunt';
import agents from '#agents/load.js';

agents.Item({
    id: 'orchestrator-properties',
    name: 'Orchestrator Properties',
    description: 'Maps data from state to agent input schema',
    instructions: `
        Property mapper. Map data references to agent input schema.

        FOR EACH FIELD IN AGENT INPUT SCHEMA:
        1. If schema field has "value" property → use that value directly
        2. If data exists → use reference string "@{agent-id}.{path}"
        3. If no match → use null

        CRITICAL:
        - NEVER copy actual data, ONLY output reference strings
        - References are short strings like "@discord:read.messages"
        - Output must be small: { properties: { field: "@ref" or value or null } }

        EXAMPLES:
        - messages array exists in discord:read → "@discord:read.messages"
        - channel string exists in discord:read → "@discord:read.channel"
        - schema has value: 100 → 100
        - no data found → null
    `,
    tokens: 1000,
    input: {
        agent: {
            type: 'object',
            description: 'Target agent definition (id, name, description, input)'
        },
        data: {
            type: 'object',
            description: 'Available data from previous agents'
        }
    },
    output: {
        properties: {
            type: 'object',
            description: 'Mapped input properties for the agent'
        }
    },
    callback: async function({input, output})
    {
        for (const [key, value] of Object.entries(output.properties || {}))
        {
            if (typeof value !== 'string' || !value.startsWith('@'))
            {
                continue;
            }

            const expression = value.slice(1).replace(/^([^.]+)/, "data['$1']");
            output.properties[key] = divhunt.Function(expression, { data: input.data || {} }, true);
        }
    }
});
