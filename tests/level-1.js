import agents from '#agents/load.js';
import orchestrator from '#orchestrator/load.js';

/* ========================================
   LEVEL 1: Single Agent
   - 1 agent, all input from data
   - Programmatic matching only
   - Planner must pick it and mark done
   ======================================== */

agents.Item({
    id: 'classify',
    name: 'Email Classifier',
    description: 'Classifies an email as important or not',
    instructions: 'Classify the email. Return priority (high/medium/low) and category.',
    input: {
        subject: { type: 'string', required: true, description: 'Email subject line' },
        body: { type: 'string', required: true, description: 'Email body text' }
    },
    output: {
        priority: { type: 'string', description: 'high, medium, or low' },
        category: { type: 'string', description: 'Category like invoice, newsletter, personal, work' }
    }
});

console.log('\n=== Level 1: Single Agent (Email Classifier) ===\n');

orchestrator.Item({
    id: 'level-1',
    steps: 3,
    agents: ['classify'],
    onPlanner: ({ plan }) => console.log('Plan:', JSON.stringify(plan)),
    onAgent: ({ agent, goal }) => console.log(`Running: ${agent} — ${goal}`),
    onSuccess: ({ state }) => console.log('Tokens:', state.tokens)
});

const orch = orchestrator.ItemGet('level-1');
const state = await orch.Fn('run', 'Classify this email into one of provided categories', {
    subject: 'Invoice #4521 — Payment overdue',
    body: 'Dear customer, your invoice of 2,450 EUR is 15 days overdue. Please process payment immediately to avoid late fees.'
});

console.log('\nRESULT:', JSON.stringify({ priority: state.output.classify?.priority, category: state.output.classify?.category }));
console.log('PASS');
