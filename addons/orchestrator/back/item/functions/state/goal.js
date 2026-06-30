import agents from '#agents/load.js';
import orchestrator from '#orchestrator/addon.js';

orchestrator.Fn('item.state.goal', async function(item, state)
{
    const agent = agents.ItemGet('orchestrator-goal');

    const sent = {
        task: state.task,
        agent: state.agents.find(a => a.id === state.agent),
        history: state.history.map(({ output, input, ...rest }) => rest)
    };

    const results = await agent.Fn('run', sent);

    state.goal = results.goal;

    return results;
});
