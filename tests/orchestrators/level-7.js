import agents from '#agents/load.js';
import orchestrator from '#orchestrator/load.js';

/* ========================================
   LEVEL 7: Iterative Content Refinement
   - 6 agents, 8 execution steps
   - review runs 2x (after write, after first revise)
   - revise runs 2x (after each review)
   - Complex dependency tracking:
     - 1st review uses write.description
     - 1st revise uses write.description + 1st review.issues
     - 2nd review uses 1st revise.description
     - 2nd revise uses 1st revise.description + 2nd review.issues
     - translate uses final revise.description
     - seo uses final revise.description + research.audience
   - Literal from goal: "German" for translate language
   - Tests orchestrator ability to:
     - Run same agent multiple times in correct sequence
     - Track which step's output to reference
     - Handle iterative refinement patterns

   Pipeline:
   research -> write -> review -> revise -> review -> revise -> translate -> seo
   ======================================== */

agents.Item({
    id: 'research',
    name: 'Product Researcher',
    description: 'Researches a product and returns key features, target audience, and competitors',
    instructions: 'Research the product. Identify 5 key features, the target audience, and 3 competitor products. Be specific and realistic.',
    input: {
        product: { type: 'string', required: true, description: 'Product name or category to research' }
    },
    output: {
        features: { type: 'array', description: 'List of 5 key product features' },
        audience: { type: 'string', description: 'Target audience description' },
        competitors: { type: 'array', description: 'List of 3 competitor product names' }
    }
});

agents.Item({
    id: 'write',
    name: 'Description Writer',
    description: 'Writes a product description from features and audience data',
    instructions: 'Write a compelling product description (3-4 sentences). Highlight key features. Target the specified audience. Professional tone.',
    input: {
        features: { type: 'array', required: true, description: 'Product features to highlight' },
        audience: { type: 'string', required: true, description: 'Target audience' }
    },
    output: {
        description: { type: 'string', description: 'Product description text' }
    }
});

agents.Item({
    id: 'review',
    name: 'Content Reviewer',
    description: 'Reviews text and returns improvement suggestions with a quality score',
    instructions: 'Review the text critically. Find 2-3 specific issues (clarity, persuasion, grammar, tone). Give a quality score 1-100. Be constructive.',
    input: {
        text: { type: 'string', required: true, description: 'Text to review' }
    },
    output: {
        issues: { type: 'array', description: 'List of specific issues found' },
        score: { type: 'number', description: 'Quality score 1-100' }
    }
});

agents.Item({
    id: 'revise',
    name: 'Content Reviser',
    description: 'Revises text based on reviewer feedback',
    instructions: 'Revise the text to address all listed issues. Keep the same length and tone. Make targeted improvements only.',
    input: {
        text: { type: 'string', required: true, description: 'Original text to revise' },
        feedback: { type: 'array', required: true, description: 'List of issues to fix' }
    },
    output: {
        description: { type: 'string', description: 'Revised text' }
    }
});

agents.Item({
    id: 'translate',
    name: 'Translator',
    description: 'Translates text to a target language',
    instructions: 'Translate the text to the specified language. Maintain tone and style. Professional translation quality.',
    input: {
        text: { type: 'string', required: true, description: 'Text to translate' },
        language: { type: 'string', required: true, description: 'Target language' }
    },
    output: {
        translated: { type: 'string', description: 'Translated text' }
    }
});

agents.Item({
    id: 'seo',
    name: 'SEO Generator',
    description: 'Generates SEO metadata from product text and audience',
    instructions: 'Generate an SEO-optimized meta title (60 chars max), meta description (155 chars max), and 5 keywords. Target the specified audience.',
    input: {
        text: { type: 'string', required: true, description: 'Product description text' },
        audience: { type: 'string', required: true, description: 'Target audience for SEO targeting' }
    },
    output: {
        title: { type: 'string', description: 'SEO meta title (max 60 characters)' },
        meta: { type: 'string', description: 'SEO meta description (max 155 characters)' },
        keywords: { type: 'array', description: 'SEO keywords list' }
    }
});

console.log('\n=== Level 7: Iterative Content Refinement (6 agents, review 2x, revise 2x) ===\n');

orchestrator.Item({
    id: 'level-7',
    task: 'Research wireless headphones, write a product description, review it, revise based on feedback, review the revision again, revise again, then translate the final version to German and generate SEO metadata',
    data: { product: 'Premium wireless noise-cancelling headphones' },
    steps: 16,
    agents: ['research', 'write', 'review', 'revise', 'translate', 'seo'],
    onFail: ({ error }) => console.log(`\n  FAILED: ${error.message}`)
});

const orch = orchestrator.ItemGet('level-7');

try
{
    const state = await orch.Fn('run');

    console.log(state);
}
catch (error)
{
    console.log('error');
}
