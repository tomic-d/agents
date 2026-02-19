import agents from '#agents/load.js';
import orchestrator from '#orchestrator/addon.js';

orchestrator.Fn('item.state.execute', async function(item, state)
{
    const agent = agents.ItemGet(state.agent);

    if (!agent)
    {
        throw new Error(`Agent not found: ${state.agent}`);
    }

    const result = await agent.Fn('run', state.goal, state.input);

    state.output = result;

    return result;
});
