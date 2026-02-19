import agents from '#agents/load.js';
import orchestrator from '#orchestrator/load.js';

/* ========================================
   LEVEL 6: HTML + CSS Section Builder
   - 4 agents: plan -> html -> css -> combine
   - Code generation (HTML/CSS strings)
   - Semantic mismatches:
     - write-css.code -> @write-html.html
     - write-css.theme -> @plan-section.theme
     - combine.markup -> @write-html.html
     - combine.styles -> @write-css.css
   - Literal from goal: section type ("hero")
   - Tests AI generating actual usable code
   ======================================== */

agents.Item({
    id: 'plan-section',
    name: 'Section Planner',
    description: 'Plans an HTML section layout, elements, and theme',
    instructions: 'Plan the section. Decide which HTML elements are needed (e.g. h1, p, button, img, nav), the layout approach (e.g. centered, split, grid), and the color theme. Return arrays and strings only.',
    input: {
        brief: { type: 'string', required: true, description: 'Description of what the section should look like' }
    },
    output: {
        elements: { type: 'array', description: 'List of HTML elements needed (e.g. ["h1", "p", "button"])' },
        layout: { type: 'string', description: 'Layout approach: centered, split, or grid' },
        theme: { type: 'string', description: 'Color theme: dark or light' }
    }
});

agents.Item({
    id: 'write-html',
    name: 'HTML Writer',
    description: 'Writes semantic HTML markup for a section',
    instructions: 'Write clean, semantic HTML for the section. Use the elements list and layout to structure the markup. Use class names for styling. Include realistic placeholder text. Return ONLY the HTML markup as a string, no explanation.',
    input: {
        elements: { type: 'array', required: true, description: 'HTML elements to include' },
        layout: { type: 'string', required: true, description: 'Layout approach' },
        brief: { type: 'string', required: true, description: 'Section description' }
    },
    output: {
        html: { type: 'string', description: 'The HTML markup code' }
    }
});

agents.Item({
    id: 'write-css',
    name: 'CSS Writer',
    description: 'Writes CSS styles for HTML markup',
    instructions: 'Write clean CSS for the provided HTML code. Match the theme and layout. Use the class names from the HTML. Include responsive basics. Return ONLY the CSS code as a string, no explanation.',
    input: {
        code: { type: 'string', required: true, description: 'HTML markup to style' },
        theme: { type: 'string', required: true, description: 'Color theme (dark or light)' },
        layout: { type: 'string', required: true, description: 'Layout approach' }
    },
    output: {
        css: { type: 'string', description: 'The CSS stylesheet code' }
    }
});

agents.Item({
    id: 'combine',
    name: 'Page Assembler',
    description: 'Combines HTML markup and CSS styles into a complete HTML page',
    instructions: 'Combine the markup and styles into a single complete HTML document. Wrap CSS in a <style> tag inside <head>. Return the full HTML page as a string.',
    input: {
        markup: { type: 'string', required: true, description: 'HTML section markup' },
        styles: { type: 'string', required: true, description: 'CSS stylesheet code' }
    },
    output: {
        page: { type: 'string', description: 'Complete HTML document with embedded CSS' }
    }
});

console.log('\n=== Level 6: HTML + CSS Section Builder (4 agents, code generation) ===\n');

orchestrator.Item({
    id: 'level-6',
    task: 'Build a dark-themed hero section for a tech startup landing page with a heading, subtitle, and call-to-action button',
    input: { brief: 'Tech startup landing page hero section. Dark theme. Bold heading, short subtitle, one CTA button. Modern, clean design.' },
    steps: 10,
    agents: ['plan-section', 'write-html', 'write-css', 'combine'],
    onFail: ({ error }) => console.log(`\n  FAILED: ${error.message}`)
});

const orch = orchestrator.ItemGet('level-6');

try
{
    const state = await orch.Fn('run');

    console.log(state);
}
catch (error)
{
    console.log('error');
}
