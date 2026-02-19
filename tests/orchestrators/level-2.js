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
    tokens: 2000,
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
    tokens: 2000,
    input: {
        facts: { type: 'array', required: true, description: 'Facts to summarize' }
    },
    output: {
        summary: { type: 'string', description: 'A 2-sentence summary' }
    }
});

console.log('\n=== Level 2: Research \u2192 Summarize (2-agent chain) ===\n');

let step = 0;

orchestrator.Item({
    id: 'level-2',
    task: 'Research and summarize the topic: Vienna',
    steps: 5,
    agents: ['research', 'summarize'],
    onDone: ({ done }) => console.log(`  [step ${step}] done: ${done}`),
    onConclusion: ({ summary }) => console.log(`  [step ${step}] conclusion: ${summary}`),
    onSelector: ({ agent }) => { step++; console.log(`  [step ${step}] selected: ${agent}`); },
    onGoal: ({ goal }) => console.log(`  [step ${step}] goal: ${goal}`),
    onProperties: ({ properties }) => console.log(`  [step ${step}] properties:`, Object.keys(properties).join(', ')),
    onAgent: ({ agent }) => console.log(`  [step ${step}] running: ${agent}`),
    onStep: ({ stop }) => console.log(`  [step ${step}] step done (stop: ${stop})`),
    onSuccess: ({ state }) => console.log(`\n  tokens: ${state.tokens.total} (prompt: ${state.tokens.prompt}, completion: ${state.tokens.completion})`),
    onFail: ({ error }) => console.log(`\n  FAILED: ${error.message}`)
});

const orch = orchestrator.ItemGet('level-2');

try 
{
    const state = await orch.Fn('run');

    console.log(state);
}
catch(error)
{
    console.log('error');
}
