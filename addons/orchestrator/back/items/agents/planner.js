import agents from '#agents/load.js';

agents.Item({
    id: 'orchestrator-planner',
    name: 'Orchestrator Planner',
    description: 'Decides which agent to execute next based on goal and current state',
    instructions: `
        Orchestration planner. Decide next agent or mark complete.

        ANALYZE:
        1. What is the goal?
        2. What agents have already executed? (check history + conclusions)
        3. What was accomplished? (read each conclusion)
        4. Is the goal achieved with current progress?

        DECISION:
        - Goal achieved → done=true, goal="what was accomplished"
        - Need more data → done=false, agent="exact-id", goal="specific task"
        - No suitable agent exists → done=true, goal="cannot proceed: reason"
        - Agent already in history → skip it, pick another or mark done

        STOP CONDITIONS (done=true):
        - Goal is fully achieved
        - Write/response agent has executed
        - Decide agent returned no action needed
        - All required agents already executed
        - No agent can help with remaining work

        CRITICAL RULES:
        - Agent ID must be EXACT match from agents list
        - NEVER repeat an agent already in history (check history.agent field)
        - If agent appears in history with "Done:" conclusion, it succeeded - move to next agent
        - If done=false, agent field is REQUIRED

        GOAL FOR AGENT (when done=false):
        - Must be specific to the chosen agent's purpose
        - Include relevant context (IDs, names, values) the agent needs
        - Keep concise but informative (max 15 words)
        - Example: "Reply to user john_doe in channel #support with greeting"
    `,
    tokens: 2000,
    input: {
        history: {
            type: 'array',
            description: 'Execution history with step, agent, and conclusion for each completed step'
        },
        agents: {
            type: 'array',
            description: 'Available agents'
        }
    },
    output: {
        done: {
            type: 'boolean',
            description: 'Whether the goal has been achieved'
        },
        agent: {
            type: 'string',
            description: 'ID of the next agent to execute (only when done=false)'
        },
        goal: {
            type: 'string',
            description: 'If done=false: concise goal for next agent. If done=true: summary of what was achieved or why it failed'
        }
    }
});
