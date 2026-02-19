import agents from '#agents/load.js';
import orchestrator from '#orchestrator/addon.js';

orchestrator.Fn('item.state.done', async function(item, state)
{
    const agent = agents.ItemGet('orchestrator-done');
    
    const conclusions = state.history.map(({ agent, goal, conclusion }) => ({ agent, goal: goal || state.task, conclusion }));

    const sent = { task: state.task, agents: state.agents, conclusions };
    const results = await agent.Fn('run', sent);

    state.done = results.done;

    if (state.debug)
    {
        state.debug(`step-${state.steps.count + 1}/done`, { sent, received: results });
    }

    return results;
});
