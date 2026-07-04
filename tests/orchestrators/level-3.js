import agents from '#agents/load.js';
import orchestrator from '#orchestrator/load.js';

/* ========================================
   LEVEL 3: Semantic Mismatch (Reference Agent)
   - 3 agents, field names don't match across agents
   - "german" must resolve to @translate-german.translation
   - "french" must resolve to @translate-french.translation
   - Reference agent required for mapping
   ======================================== */

agents.Item({
    id: 'translate-german',
    name: 'German Translator',
    description: 'Translates text to German',
    instructions: 'Translate the given text to German. Return only the translation.',
    tokens: 500,
    input: {
        text: { type: 'string', required: true, description: 'Text to translate' }
    },
    output: {
        translation: { type: 'string', description: 'German translation' }
    }
});

agents.Item({
    id: 'translate-french',
    name: 'French Translator',
    description: 'Translates text to French',
    instructions: 'Translate the given text to French. Return only the translation.',
    tokens: 500,
    input: {
        text: { type: 'string', required: true, description: 'Text to translate' }
    },
    output: {
        translation: { type: 'string', description: 'French translation' }
    }
});

agents.Item({
    id: 'compare',
    name: 'Translation Comparator',
    description: 'Compares two translations and picks the more elegant one',
    instructions: 'Compare the two translations. Pick the more elegant one and explain why in one sentence.',
    tokens: 500,
    input: {
        german: { type: 'string', required: true, description: 'German translation' },
        french: { type: 'string', required: true, description: 'French translation' }
    },
    output: {
        winner: { type: 'string', description: 'Which language won (german or french)' },
        reason: { type: 'string', description: 'Why it won' }
    }
});

console.log('\n=== Level 3: Translate DE + FR \u2192 Compare (semantic mismatch) ===\n');

orchestrator.Item({
    id: 'level-3',
    task: 'Translate "The sun sets behind the mountains" to German and French, then compare which translation is more elegant',
    data: { text: 'The sun sets behind the mountains' },
    steps: 6,
    agents: ['translate-german', 'translate-french', 'compare'],
    onFail: ({ error }) => console.log(`\n  FAILED: ${error.message}`)
});

const orch = orchestrator.ItemGet('level-3');

try
{
    const state = await orch.Fn('run');

    console.log(state);
}
catch (error)
{
    console.log('error');
}
