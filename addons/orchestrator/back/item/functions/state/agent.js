import agents from '#agents/load.js';
import orchestrator from '#orchestrator/addon.js';

orchestrator.Fn('item.state.agent', async function(item, state)
{
    const agent = agents.ItemGet('orchestrator-agent');

    const sent = {
        task: state.task,
        history: state.history.map(({ output, input, ...rest }) => rest),
        agents: state.agents
    };

    const results = await agent.Fn('run', sent);

    state.agent = results.agent;

    return results;
});
