import agents from '#agents/load.js';
import orchestrator from '#orchestrator/load.js';

/* ========================================
   LEVEL 4: Literal Extraction + Defaults + Mixed Types
   - 3 agents, mixed types (string, number, array)
   - "limit" must come from goal text (literal agent)
   - "format" has a default value (schema fallback)
   - "language" must come from goal text (literal agent)
   - Semantic mismatch: "entries" needs @search.results (reference agent)
   - Tests all 4 pipeline steps
   ======================================== */

agents.Item({
    id: 'search',
    name: 'Content Search',
    description: 'Searches for content about a topic and returns results',
    instructions: 'Search for content about the given topic. Return an array of result titles and a total count.',
    input: {
        query: { type: 'string', required: true, description: 'Search query' },
        limit: { type: 'number', required: true, description: 'Max number of results to return' }
    },
    output: {
        results: { type: 'array', description: 'Array of result titles' },
        count: { type: 'number', description: 'Total number of results found' }
    }
});

agents.Item({
    id: 'translate-results',
    name: 'Result Translator',
    description: 'Translates an array of text entries to a target language',
    instructions: 'Translate each entry to the target language. Return translated array.',
    input: {
        entries: { type: 'array', required: true, description: 'Array of text entries to translate' },
        language: { type: 'string', required: true, description: 'Target language' }
    },
    output: {
        translated: { type: 'array', description: 'Translated entries' }
    }
});

agents.Item({
    id: 'format-output',
    name: 'Output Formatter',
    description: 'Formats results into a final output string',
    instructions: 'Format the translated results and count into a readable output. Use the specified format style.',
    input: {
        translated: { type: 'array', required: true, description: 'Translated results' },
        count: { type: 'number', required: true, description: 'Total count' },
        format: { type: 'string', required: true, description: 'Format style', value: 'bullet-list' }
    },
    output: {
        output: { type: 'string', description: 'Formatted output string' }
    }
});

console.log('\n=== Level 4: Search → Translate → Format (literal + defaults + reference) ===\n');

orchestrator.Item({
    id: 'level-4',
    task: 'First search for 5 articles about machine learning, then translate the results to Spanish, then format the translated results as a bullet list',
    data: { query: 'machine learning' },
    steps: 8,
    agents: ['search', 'translate-results', 'format-output'],
    onFail: ({ error }) => console.log(`\n  FAILED: ${error.message}`)
});

const orch = orchestrator.ItemGet('level-4');

try
{
    const state = await orch.Fn('run');

    console.log(state);
}
catch (error)
{
    console.log('error');
}
