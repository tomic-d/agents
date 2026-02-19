import agents from '#agents/load.js';
import orchestrator from '#orchestrator/load.js';

/* ========================================
   Book Analysis — Document Chunking Pipeline
   - 4 agents: load, split, analyze, synthesize
   - Load fetches a book from Project Gutenberg
   - Split divides text into ~4000 char chunks (dynamic output keys via callback)
   - Analyze runs N times — once per chunk (fan-out pattern)
   - Synthesize combines all analyses into a final answer

   Tests:
   - Same agent running N times dynamically
   - Dynamic output keys (chunk_0, chunk_1, ...) surviving outside schema
   - Reference resolution under heavy ambiguity (chunk → chunk_0..chunk_N)
   - External state collection via module-level store + context injection
   - Mixed resolution: programmatic (source, text, question, title) + reference (chunk)

   Pipeline:
   load -> split -> analyze x N -> synthesize
   ======================================== */

const store = { chunks: [], analyses: [] };

/* --- Agent 1: Load --- */

agents.Item({
    id: 'load',
    name: 'Document Loader',
    description: 'Loads a document from a URL and returns its text content with metadata',
    instructions: `
        You receive document text in context.
        Identify the title and author from the content.
        Count the total words.
        Return the full text as-is in the text field.
    `,
    tokens: 500,
    context: async ({ data }) =>
    {
        const response = await fetch(data.source);
        const raw = await response.text();
        const text = raw.replace(/\r\n/g, '\n').trim();

        return { content: text.slice(0, 30000) };
    },
    input: {
        source: { type: 'string', required: true, description: 'URL of the document to load' }
    },
    output: {
        text: { type: 'string', required: true, description: 'Full document text content' },
        title: { type: 'string', required: true, description: 'Document title' },
        author: { type: 'string', required: true, description: 'Document author' },
        words: { type: 'number', required: true, description: 'Total word count' }
    }
});

/* --- Agent 2: Split --- */

agents.Item({
    id: 'split',
    name: 'Document Splitter',
    description: 'Splits document text into numbered chunks for independent analysis',
    instructions: `
        You receive document text that has been split into chunks.
        The chunk count and previews are in context.
        Confirm the split by returning the total number of chunks.
        Write a brief one-line description of what each chunk contains.
    `,
    tokens: 800,
    context: ({ data }) =>
    {
        const text = data.text;
        const size = 4000;
        const chunks = [];

        for (let i = 0; i < text.length; i += size)
        {
            chunks.push(text.slice(i, i + size));
        }

        store.chunks = chunks;

        return {
            total: chunks.length,
            previews: chunks.map((c, i) => `Chunk ${i}: ${c.slice(0, 100)}...`)
        };
    },
    input: {
        text: { type: 'string', required: true, description: 'Full document text to split into chunks' }
    },
    output: {
        total: { type: 'number', required: true, description: 'Number of chunks created' },
        descriptions: { type: 'array', required: true, description: 'Brief description of each chunk content' }
    },
    callback: ({ output }) =>
    {
        for (let i = 0; i < store.chunks.length; i++)
        {
            output[`chunk_${i}`] = store.chunks[i];
        }
    }
});

/* --- Agent 3: Analyze --- */

agents.Item({
    id: 'analyze',
    name: 'Chunk Analyzer',
    description: 'Analyzes a single document chunk and extracts themes, key points, and a summary',
    instructions: `
        Analyze the provided text chunk.
        Identify the main themes present in this chunk.
        Extract key points or arguments made.
        Write a concise summary (2-3 sentences).
        Be specific to the content — do not generalize.
    `,
    tokens: 500,
    input: {
        chunk: { type: 'string', required: true, description: 'Text chunk to analyze' }
    },
    output: {
        themes: { type: 'array', required: true, description: 'Main themes found in the chunk' },
        points: { type: 'array', required: true, description: 'Key points or arguments made' },
        summary: { type: 'string', required: true, description: 'Concise summary of the chunk' }
    },
    callback: ({ output }) =>
    {
        store.analyses.push({
            themes: output.themes,
            points: output.points,
            summary: output.summary
        });
    }
});

/* --- Agent 4: Synthesize --- */

agents.Item({
    id: 'synthesize',
    name: 'Analysis Synthesizer',
    description: 'Combines all chunk analyses into a comprehensive answer to the question',
    instructions: `
        You receive all chunk analyses in context and the original question.
        Synthesize the individual analyses into one coherent answer.
        Address the question directly using evidence from the analyses.
        Be thorough but concise. 3-5 sentences.
    `,
    tokens: 1500,
    context: () => ({ analyses: store.analyses }),
    input: {
        question: { type: 'string', required: true, description: 'Original question to answer about the document' },
        title: { type: 'string', required: true, description: 'Document title for reference' }
    },
    output: {
        answer: { type: 'string', required: true, description: 'Comprehensive answer to the question' },
        confidence: { type: 'number', required: true, description: 'Confidence score 0-100' },
        sources: { type: 'number', required: true, description: 'Number of chunks that contributed to the answer', populate: false }
    },
    callback: ({ output }) =>
    {
        output.sources = store.analyses.length;
    }
});

/* --- Orchestrator --- */

console.log('\n=== Book Analysis — Document Chunking Pipeline (load -> split -> analyze x N -> synthesize) ===\n');

orchestrator.Item({
    id: 'book',
    task: 'Load The Art of War from the URL, split it into chunks, analyze each chunk independently to extract themes and key points, then synthesize all analyses to answer the question',
    data: {
        source: 'https://www.gutenberg.org/cache/epub/132/pg132.txt',
        question: 'What are the core strategic principles according to this text, and how do they relate to leadership?'
    },
    steps: 20,
    agents: ['load', 'split', 'analyze', 'synthesize'],
    onFail: ({ error }) => console.log(`\n  FAILED: ${error.message}`)
});

const orch = orchestrator.ItemGet('book');

try
{
    const state = await orch.Fn('run');

    console.log('\n=== RESULT ===\n');
    console.log('Answer:', state.output.answer);
    console.log('Confidence:', state.output.confidence);
    console.log('Sources:', state.output.sources);
    console.log('Steps:', state.steps.count);
    console.log('Tokens:', state.tokens);
    console.log('Analyses collected:', store.analyses.length);
}
catch (error)
{
    console.log('error:', error.message);
}
