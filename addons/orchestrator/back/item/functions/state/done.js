import agents from '#agents/load.js';
import orchestrator from '#orchestrator/addon.js';

orchestrator.Fn('item.state.done', async function(item, state)
{
    const agent = agents.ItemGet('orchestrator-done');
    
    const conclusions = state.history.map(({ agent, conclusion }) => ({ agent, conclusion }));

    const results = await agent.Fn('run', `Check: ${state.task}`, {
        task: state.task,
        conclusions
    });

    state.done = results.done;

    return results;
});
