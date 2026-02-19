import agents from '#agents/load.js';
import orchestrator from '#orchestrator/load.js';

const test = process.argv[2];

/* ========================================
   TEST 1: Research → Summarize (original)
   String input, array chain, 2 agents
   ======================================== */

if (test === '1')
{
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

    console.log('\n=== Test 1: Research → Summarize ===');

    orchestrator.Item({
        id: 'test-1',
        steps: 5,
        onPlanner: ({ plan }) => console.log('Plan:', JSON.stringify(plan)),
        onAgent: ({ agent, goal }) => console.log(`Running: ${agent} — ${goal}`),
        onSuccess: ({ state }) => console.log('Tokens:', state.tokens)
    });

    const orch = orchestrator.ItemGet('test-1');
    const state = await orch.Fn('run', 'Research and summarize the topic: Vienna', { topic: 'Vienna' });
    console.log('PASS — summary:', state.output.summarize?.summary?.slice(0, 80) + '...');
}

/* ========================================
   TEST 2: Translate chain
   String → String → String, 3 agents
   ======================================== */

if (test === '2')
{
    agents.Item({
        id: 'translate-german',
        name: 'German Translator',
        description: 'Translates text to German',
        instructions: 'Translate the given text to German. Return only the translation.',
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
        input: {
            german: { type: 'string', required: true, description: 'German translation' },
            french: { type: 'string', required: true, description: 'French translation' }
        },
        output: {
            winner: { type: 'string', description: 'Which language won (german or french)' },
            reason: { type: 'string', description: 'Why it won' }
        }
    });

    console.log('\n=== Test 2: Translate DE + FR → Compare ===');

    orchestrator.Item({
        id: 'test-2',
        steps: 6,
        onPlanner: ({ plan }) => console.log('Plan:', JSON.stringify(plan)),
        onAgent: ({ agent, goal }) => console.log(`Running: ${agent} — ${goal}`),
        onSuccess: ({ state }) => console.log('Tokens:', state.tokens)
    });

    const orch = orchestrator.ItemGet('test-2');
    const state = await orch.Fn('run', 'Translate "The sun sets behind the mountains" to German and French, then compare which translation is more elegant', { text: 'The sun sets behind the mountains' });
    console.log('PASS — winner:', state.output.compare?.winner, '—', state.output.compare?.reason?.slice(0, 80));
}

/* ========================================
   TEST 3: Single agent orchestration
   Only 1 agent available, edge case
   ======================================== */

if (test === '3')
{
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

    console.log('\n=== Test 3: Single Agent (Email Classifier) ===');

    orchestrator.Item({
        id: 'test-3',
        steps: 3,
        agents: ['classify'],
        onPlanner: ({ plan }) => console.log('Plan:', JSON.stringify(plan)),
        onAgent: ({ agent, goal }) => console.log(`Running: ${agent} — ${goal}`),
        onSuccess: ({ state }) => console.log('Tokens:', state.tokens)
    });

    const orch = orchestrator.ItemGet('test-3');
    const state = await orch.Fn('run', 'Classify this email', { subject: 'Invoice #4521 — Payment overdue', body: 'Dear customer, your invoice of 2,450 EUR is 15 days overdue. Please process payment immediately to avoid late fees.' });
    console.log('PASS — priority:', state.output.classify?.priority, '— category:', state.output.classify?.category);
}

/* ========================================
   TEST 4: Number + object types
   Mixed types, data transformation
   ======================================== */

if (test === '4')
{
    agents.Item({
        id: 'calculate',
        name: 'Calculator',
        description: 'Performs a calculation on two numbers',
        instructions: 'Calculate the result of the operation on the two numbers. Return the result as a number.',
        input: {
            a: { type: 'number', required: true, description: 'First number' },
            b: { type: 'number', required: true, description: 'Second number' },
            operation: { type: 'string', required: true, description: 'Operation: add, subtract, multiply, divide' }
        },
        output: {
            result: { type: 'number', description: 'The calculation result' }
        }
    });

    agents.Item({
        id: 'format',
        name: 'Number Formatter',
        description: 'Formats a number into a human-readable sentence',
        instructions: 'Format the number into a sentence like "The result is X".',
        input: {
            result: { type: 'number', required: true, description: 'Number to format' }
        },
        output: {
            sentence: { type: 'string', description: 'Human-readable sentence' }
        }
    });

    console.log('\n=== Test 4: Calculate → Format (number types) ===');

    orchestrator.Item({
        id: 'test-4',
        steps: 5,
        onPlanner: ({ plan }) => console.log('Plan:', JSON.stringify(plan)),
        onAgent: ({ agent, goal }) => console.log(`Running: ${agent} — ${goal}`),
        onSuccess: ({ state }) => console.log('Tokens:', state.tokens)
    });

    const orch = orchestrator.ItemGet('test-4');
    const state = await orch.Fn('run', 'Multiply 17 by 23 and format the result as a sentence', { a: 17, b: 23, operation: 'multiply' });
    console.log('PASS — sentence:', state.output.format?.sentence);
}

/* ========================================
   TEST 5: 3-agent chain with array data
   Extract → Analyze → Report
   ======================================== */

if (test === '5')
{
    agents.Item({
        id: 'extract',
        name: 'Keyword Extractor',
        description: 'Extracts keywords from text',
        instructions: 'Extract the 5 most important keywords from the text. Return as array of strings.',
        input: {
            text: { type: 'string', required: true, description: 'Text to extract keywords from' }
        },
        output: {
            keywords: { type: 'array', description: 'Array of 5 keywords' }
        }
    });

    agents.Item({
        id: 'analyze',
        name: 'Sentiment Analyzer',
        description: 'Analyzes sentiment of text and keywords',
        instructions: 'Analyze the overall sentiment of the text. Return sentiment (positive/negative/neutral) and a confidence score 0-100.',
        input: {
            text: { type: 'string', required: true, description: 'Original text' },
            keywords: { type: 'array', required: true, description: 'Keywords extracted from text' }
        },
        output: {
            sentiment: { type: 'string', description: 'positive, negative, or neutral' },
            confidence: { type: 'number', description: 'Confidence score 0-100' }
        }
    });

    agents.Item({
        id: 'report',
        name: 'Report Writer',
        description: 'Writes a brief report from analysis results',
        instructions: 'Write a 1-paragraph report combining the keywords, sentiment, and confidence into a brief analysis.',
        input: {
            keywords: { type: 'array', required: true, description: 'Extracted keywords' },
            sentiment: { type: 'string', required: true, description: 'Sentiment result' },
            confidence: { type: 'number', required: true, description: 'Confidence score' }
        },
        output: {
            report: { type: 'string', description: 'Brief analysis report' }
        }
    });

    console.log('\n=== Test 5: Extract → Analyze → Report (3-chain) ===');

    orchestrator.Item({
        id: 'test-5',
        steps: 6,
        onPlanner: ({ plan }) => console.log('Plan:', JSON.stringify(plan)),
        onAgent: ({ agent, goal }) => console.log(`Running: ${agent} — ${goal}`),
        onSuccess: ({ state }) => console.log('Tokens:', state.tokens)
    });

    const orch = orchestrator.ItemGet('test-5');
    const state = await orch.Fn('run', 'Analyze this text: extract keywords, determine sentiment, write a report', { text: 'The new product launch exceeded all expectations. Sales doubled in the first week, customer reviews are overwhelmingly positive, and the team morale is at an all-time high. However, supply chain delays may impact future orders.' });
    console.log('PASS — report:', state.output.report?.report?.slice(0, 100) + '...');
}

if (!test)
{
    console.log('Usage: node test.js <1-5>');
    console.log('  1 — Research → Summarize (string input, 2 agents)');
    console.log('  2 — Translate DE + FR → Compare (3 agents, parallel-style)');
    console.log('  3 — Single agent (email classifier, restricted agents list)');
    console.log('  4 — Calculate → Format (number types)');
    console.log('  5 — Extract → Analyze → Report (3-chain, mixed types)');
}
