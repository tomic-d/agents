import agents from '#agents/load.js';
import orchestrator from '#orchestrator/addon.js';

orchestrator.Fn('item.state.execute', async function(item, state)
{
    const agent = agents.ItemGet(state.agent);

    if (!agent)
    {
        throw new Error(`Agent not found: ${state.agent}`);
    }

    const sent = { goal: state.goal, ...state.input };
    const result = await agent.Fn('run', sent);

    const { _meta, ...output } = result;

    state.output = output;

    if (_meta?.tokens)
    {
        state.tokens.input += _meta.tokens.input || 0;
        state.tokens.output += _meta.tokens.output || 0;
    }

    if (state.debug)
    {
        state.debug(`step-${state.step}/execute`, { agent: state.agent, sent, received: result });
    }

    return result;
});
