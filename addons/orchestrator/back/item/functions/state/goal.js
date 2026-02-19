import agents from '#agents/load.js';
import orchestrator from '#orchestrator/addon.js';

orchestrator.Fn('item.state.goal', async function(item, state)
{
    const agent = agents.ItemGet('orchestrator-goal');

    const results = await agent.Fn('run', `Write goal for: ${state.agent}`, {
        task: state.task,
        agent: state.agent,
        history: state.history.map(({ output, input, ...rest }) => rest)
    });

    state.goal = results.goal;

    return results;
});