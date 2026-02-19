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
        category: { type: 'string', description: 'Category like newsletter, personal, work or other' }
    }
});

console.log('\n=== Level 1: Single Agent (Email Classifier) ===\n');

orchestrator.Item({
    id: 'level-1',
    task: 'Classify this email into one of provided categories',
    data: {
        subject: 'Invoice #4521 — Payment overdue',
        body: 'Dear customer, this is PERSONAL work and your invoice of 2,450 EUR is 15 days overdue. Please process payment immediately to avoid late fees.'
    },
    steps: 3,
    agents: ['classify'],
    onFail: ({ error }) => console.log(`\n  FAILED: ${error.message}`)
});

const orch = orchestrator.ItemGet('level-1');

try
{
    const state = await orch.Fn('run');

    console.log(state);
}
catch (error)
{
    console.log('error');
}
