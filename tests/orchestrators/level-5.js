import agents from '#agents/load.js';
import orchestrator from '#orchestrator/load.js';

/* ========================================
   LEVEL 5: Full Pipeline Stress Test
   - 5 agents, complex data flow
   - Multiple semantic mismatches (reference agent called multiple times)
   - Literal value from goal ("top 8 keywords" -> max: 8)
   - Default value fallback (style: "professional")
   - Mixed types: string, number, array
   - Planner must figure out correct execution order
   - Some agents share field names, some don't

   Pipeline:
   parse-article -> extract-keywords -> sentiment -> categorize -> write-summary

   Semantic mismatches:
   - extract-keywords.content -> @parse-article.body
   - sentiment.text -> @parse-article.body
   - categorize.mood -> @sentiment.mood
   - write-summary.headline -> @parse-article.title
   - write-summary.language -> @extract-keywords.language

   Literal from goal:
   - extract-keywords.max -> 8 (from "top 8 keywords")

   Default:
   - write-summary.style -> "professional"

   Programmatic:
   - sentiment.keywords -> extract-keywords.keywords
   - categorize.keywords, score -> programmatic
   - write-summary.category, tags, confidence -> programmatic
   ======================================== */

agents.Item({
    id: 'parse-article',
    name: 'Article Parser',
    description: 'Parses an article URL and extracts title, body text, and word count',
    instructions: 'Parse the article at the given URL. Extract the title, full body text, and count the words. Since you cannot actually fetch URLs, generate realistic article content about the topic implied by the URL.',
    input: {
        url: { type: 'string', required: true, description: 'Article URL to parse' }
    },
    output: {
        title: { type: 'string', description: 'Article title' },
        body: { type: 'string', description: 'Full article body text' },
        wordcount: { type: 'number', description: 'Number of words in the body' }
    }
});

agents.Item({
    id: 'extract-keywords',
    name: 'Keyword Extractor',
    description: 'Extracts the most important keywords from content text',
    instructions: 'Extract the most important keywords from the content. Return exactly as many as specified by max. Also detect the language of the content.',
    input: {
        content: { type: 'string', required: true, description: 'Text content to extract keywords from' },
        max: { type: 'number', required: true, description: 'Maximum number of keywords to extract' }
    },
    output: {
        keywords: { type: 'array', description: 'Array of extracted keywords' },
        language: { type: 'string', description: 'Detected language of the content (e.g. English, German)' }
    }
});

agents.Item({
    id: 'sentiment',
    name: 'Sentiment Analyzer',
    description: 'Analyzes sentiment of text using keywords as context',
    instructions: 'Analyze the sentiment of the text. Use the keywords to understand key themes. Return mood (positive/negative/neutral/mixed) and a confidence score 0-100.',
    input: {
        text: { type: 'string', required: true, description: 'Text to analyze' },
        keywords: { type: 'array', required: true, description: 'Keywords for context' }
    },
    output: {
        mood: { type: 'string', description: 'Sentiment mood: positive, negative, neutral, or mixed' },
        score: { type: 'number', description: 'Confidence score 0-100' }
    }
});

agents.Item({
    id: 'categorize',
    name: 'Content Categorizer',
    description: 'Categorizes content based on keywords, mood, and score',
    instructions: 'Categorize the content into a single category (e.g. technology, science, business, health, politics). Generate relevant tags. Return confidence as a percentage.',
    input: {
        keywords: { type: 'array', required: true, description: 'Extracted keywords' },
        mood: { type: 'string', required: true, description: 'Sentiment mood' },
        score: { type: 'number', required: true, description: 'Sentiment confidence score' }
    },
    output: {
        category: { type: 'string', description: 'Content category' },
        tags: { type: 'array', description: 'Relevant tags' },
        confidence: { type: 'number', description: 'Categorization confidence 0-100' }
    }
});

agents.Item({
    id: 'write-summary',
    name: 'Summary Writer',
    description: 'Writes a polished summary combining all analysis results',
    instructions: 'Write a 3-sentence summary of the article. Include the category, key tags, and confidence level. Match the specified style and language.',
    input: {
        headline: { type: 'string', required: true, description: 'Article headline/title' },
        category: { type: 'string', required: true, description: 'Content category' },
        tags: { type: 'array', required: true, description: 'Content tags' },
        confidence: { type: 'number', required: true, description: 'Analysis confidence' },
        language: { type: 'string', required: true, description: 'Output language' },
        style: { type: 'string', required: true, description: 'Writing style', value: 'professional' }
    },
    output: {
        summary: { type: 'string', description: 'Final polished summary' }
    }
});

console.log('\n=== Level 5: Full Pipeline (5 agents, all 4 property steps) ===\n');

orchestrator.Item({
    id: 'level-5',
    task: 'Analyze this article: parse it, extract top 8 keywords, analyze sentiment, categorize it, and write a summary',
    data: { url: 'https://example.com/articles/ai-revolution-2026' },
    steps: 12,
    agents: ['parse-article', 'extract-keywords', 'sentiment', 'categorize', 'write-summary'],
    onFail: ({ error }) => console.log(`\n  FAILED: ${error.message}`)
});

const orch = orchestrator.ItemGet('level-5');

try
{
    const state = await orch.Fn('run');

    console.log(state);
}
catch (error)
{
    console.log('error');
}
