import agents from '#agents/load.js';
import orchestrator from '#orchestrator/load.js';

/* ========================================
   AI News Scanner — Advanced
   - 8 agents: gate, scrape, scan, merge, enrich, summarize, translate, notify
   - Gate checks if already scanned today
   - Scrape fetches AI news site → articles
   - Scan fetches TechCrunch AI → headlines (different field name!)
   - Merge combines articles + headlines → feed (third field name!)
   - Enrich expects "items" (must use reference resolution from "feed")
   - Summarize writes a digest from items
   - Translate converts to Serbian
   - Notify sends to Slack

   Tests:
   - Two scrapers with different output field names
   - Merge combining from 2 non-adjacent sources
   - Cross-reference resolution: feed → items

   Pipeline:
   gate -> scrape -> scan -> merge -> enrich -> summarize -> translate -> notify
   ======================================== */

let lastScan = null;

/* --- Agent 1: Gate --- */

agents.Item({
    id: 'gate',
    name: 'News Gate',
    description: 'Checks if news scanning should run today based on the last scan date',
    instructions: `
        Check if scanning was already done today.
        Compare lastScan date with today date from context.
        If they match — set proceed to false (already scanned today).
        If they do not match or lastScan is null — set proceed to true (needs scanning).
    `,
    tokens: 200,
    context: () => ({ lastScan, today: new Date().toISOString().split('T')[0] }),
    input: {},
    output: {
        proceed: { type: 'boolean', required: true, description: 'Whether to proceed with scanning' },
        reason: { type: 'string', required: true, description: 'Short reason for the decision' }
    },
    callback: async ({ output }) =>
    {
        if (output.proceed)
        {
            lastScan = new Date().toISOString().split('T')[0];
        }
    }
});

/* --- Agent 2: Scrape (AI News) --- */

agents.Item({
    id: 'scrape',
    name: 'AI News Scraper',
    description: 'Scrapes an AI news website and extracts the latest article headlines',
    instructions: `
        You receive raw website text content in context.
        Extract up to 3 of the most recent article headlines.
        Return them as an array of objects with title and url fields.
        Only include real articles — skip navigation, ads, and footer links.
        If no articles found — return an empty array.
    `,
    tokens: 1000,
    context: async ({ data }) =>
    {
        const response = await fetch(data.url);
        const html = await response.text();
        const text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        return { content: text.slice(0, 8000) };
    },
    input: {
        url: { type: 'string', required: true, description: 'URL of the news website to scrape' }
    },
    output: {
        articles: { type: 'array', required: true, description: 'Array of article objects with title and url' }
    }
});

/* --- Agent 3: Scan (VentureBeat) --- */

agents.Item({
    id: 'scan',
    name: 'Tech News Scanner',
    description: 'Scans a tech news website and extracts the latest AI headlines',
    instructions: `
        You receive raw website text content in context.
        Extract up to 3 of the most recent AI-related headlines.
        Return them as an array of objects with title and url fields.
        Only include real articles — skip navigation, ads, and footer links.
        If no articles found — return an empty array.
    `,
    tokens: 1000,
    context: async ({ data }) =>
    {
        const response = await fetch(data.url);
        const html = await response.text();
        const text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        return { content: text.slice(0, 8000) };
    },
    input: {
        url: { type: 'string', required: true, description: 'URL of the tech news website to scan' }
    },
    output: {
        headlines: { type: 'array', required: true, description: 'Array of headline objects with title and url' }
    }
});

/* --- Agent 4: Merge --- */

agents.Item({
    id: 'merge',
    name: 'Article Merger',
    description: 'Combines articles from multiple sources into a single feed',
    instructions: `
        Combine both article lists into one unified feed.
        Remove duplicates based on similar titles.
        Keep all fields from each article.
        Add a "source" field to each: "ai-news" for articles, "venturebeat" for headlines.
    `,
    tokens: 800,
    input: {
        articles: { type: 'array', required: true, description: 'Articles from the AI news source' },
        headlines: { type: 'array', required: true, description: 'Headlines from the tech news source' }
    },
    output: {
        feed: { type: 'array', required: true, description: 'Combined feed of all articles from both sources' }
    }
});

/* --- Agent 5: Enrich --- */

agents.Item({
    id: 'enrich',
    name: 'Article Enricher',
    description: 'Adds a one-line business insight for each item in a feed',
    instructions: `
        For each item, write a short one-line insight or business takeaway.
        Add it as an "insight" field to each item object.
        Keep each insight under 100 characters. Professional tone.
    `,
    tokens: 800,
    input: {
        items: { type: 'array', required: true, description: 'Feed items to enrich with insights' }
    },
    output: {
        items: { type: 'array', required: true, description: 'Items with insight field added' }
    }
});

/* --- Agent 6: Summarize --- */

agents.Item({
    id: 'summarize',
    name: 'News Summarizer',
    description: 'Writes a structured news digest grouped by source with insights',
    instructions: `
        Write a structured news digest from the enriched items.
        Group by source field.
        For each item show: title and insight.
        Add a brief intro sentence at the top.
        Keep it under 800 characters total. Professional tone.
        Use plain text with line breaks, no markdown.
    `,
    tokens: 800,
    input: {
        items: { type: 'array', required: true, description: 'Enriched items with source and insight' }
    },
    output: {
        digest: { type: 'string', required: true, description: 'Structured news digest text' }
    }
});

/* --- Agent 7: Translate --- */

agents.Item({
    id: 'translate',
    name: 'Serbian Translator',
    description: 'Translates a text digest from English to Serbian',
    instructions: `
        Translate the digest text from English to Serbian.
        Keep the exact same formatting and structure.
        Use natural Serbian — not word-for-word translation.
        Keep source labels in English.
    `,
    tokens: 800,
    input: {
        digest: { type: 'string', required: true, description: 'English digest text to translate' }
    },
    output: {
        digest: { type: 'string', required: true, description: 'Serbian translation of the digest' }
    }
});

/* --- Agent 8: Notify --- */

agents.Item({
    id: 'notify',
    name: 'Slack Notifier',
    description: 'Formats and sends a message to Slack via webhook',
    instructions: `
        Format the digest for Slack.
        Add a header with today's date from context.
        Keep the formatting clean — use plain text with line breaks.
        Return the formatted message text.
    `,
    tokens: 500,
    context: () => ({ today: new Date().toISOString().split('T')[0] }),
    input: {
        digest: { type: 'string', required: true, description: 'News digest text to send' }
    },
    output: {
        message: { type: 'string', required: true, description: 'Formatted Slack message' },
        sent: { type: 'boolean', required: true, description: 'Whether the message was sent successfully', populate: false }
    },
    callback: async ({ output }) =>
    {
        const webhook = process.env.SLACK_WEBHOOK;

        if (!webhook)
        {
            output.sent = false;
            return;
        }

        const response = await fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: output.message })
        });

        output.sent = response.ok;
    }
});

/* --- Orchestrator --- */

console.log('\n=== AI News Scanner Advanced (gate -> scrape -> scan -> merge -> enrich -> summarize -> translate -> notify) ===\n');

orchestrator.Item({
    id: 'news',
    task: 'Check if AI news needs scanning today, scrape articles from AI news site, scan headlines from The Decoder, merge both sources, add business insights, write a structured digest, translate it to Serbian, and send it to Slack',
    data: {
        url: 'https://www.artificialintelligence-news.com/',
        url2: 'https://the-decoder.com/'
    },
    steps: 14,
    agents: ['gate', 'scrape', 'scan', 'merge', 'enrich', 'summarize', 'translate', 'notify'],
    onFail: ({ error }) => console.log(`\n  FAILED: ${error.message}`)
});

const orch = orchestrator.ItemGet('news');

try
{
    const state = await orch.Fn('run');

    console.log(state);
}
catch (error)
{
    console.log('error:', error.message);
}
