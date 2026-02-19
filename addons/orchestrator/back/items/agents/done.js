import agents from '#agents/load.js';

agents.Item({
    id: 'orchestrator-done',
    name: 'Orchestrator Done',
    description: 'Checks if the orchestration goal has been achieved',
    instructions: `
        Check if the goal has been fully achieved based on execution history.

        RULES:
        1. Compare the GOAL against history conclusions
        2. If history conclusions show the goal is achieved → done = true
        3. Having available agents does NOT mean more work is needed
        4. An agent that already ran successfully should NOT run again unless the goal explicitly requires repetition
        5. When in doubt after at least one agent executed → done = true

        OUTPUT FORMAT:
        { "done": true/false, "conclusion": "Done: ..." }

        EXAMPLES:
        - Goal: "Classify email", history: [{ agent: "classify", conclusion: "Done: classified as high priority" }] → done = true
        - Goal: "Research and summarize Vienna", history: [{ agent: "research", conclusion: "Done: found 3 facts" }] → done = false (summarize not done yet)
        - Goal: "Research and summarize Vienna", history: [{ agent: "research", conclusion: "Done: found 3 facts" }, { agent: "summarize", conclusion: "Done: summary written" }] → done = true
    `,
    tokens: 300,
    input: {
        history: {
            type: 'array',
            description: 'Execution history with agent and conclusion for each step'
        },
        agents: {
            type: 'array',
            description: 'Available agents that can be executed'
        }
    },
    output: {
        done: {
            type: 'boolean',
            description: 'Whether the goal has been achieved'
        }
    }
});
