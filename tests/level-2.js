import agents from '#agents/load.js';
import orchestrator from '#orchestrator/load.js';

/* ========================================
   LEVEL 2: Two-Agent Chain
   - 2 agents, output of first feeds second
   - Programmatic matching (exact field name: "facts")
   - Planner must sequence correctly
   ======================================== */

agents.Item({
    id: 'research',
    name: 'Researcher',
    description: 'Researches a topic and returns key facts',
    instructions: 'Research the given topic. Return 3 key facts about it.',
    input: {
        topic: { type: 'string', required: true, description: 'Topic to research' }
    },
    output: {
        facts: { type: 'array', description: 'Array of 3 key facts about the topic' }
    }
});

agents.Item({
    id: 'summarize',
    name: 'Summarizer',
    description: 'Writes a short summary from provided facts',
    instructions: 'Write a 2-sentence summary from the provided facts.',
    input: {
        facts: { type: 'array', required: true, description: 'Facts to summarize' }
    },
    output: {
        summary: { type: 'string', description: 'A 2-sentence summary' }
    }
});

console.log('\n=== Level 2: Research \u2192 Summarize (2-agent chain) ===\n');

orchestrator.Item({
    id: 'level-2',
    steps: 5,
    onPlanner: ({ plan }) => console.log('Plan:', JSON.stringify(plan)),
    onAgent: ({ agent, goal }) => console.log(`Running: ${agent} \u2014 ${goal}`),
    onSuccess: ({ state }) => console.log('Tokens:', state.tokens)
});

const orch = orchestrator.ItemGet('level-2');
const state = await orch.Fn('run', 'Research and summarize the topic: Vienna', { topic: 'Vienna' });

console.log('\nRESULT:', state.output.summarize?.summary?.slice(0, 120) + '...');
console.log('PASS');
