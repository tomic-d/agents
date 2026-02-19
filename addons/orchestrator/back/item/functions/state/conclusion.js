import agents from '#agents/load.js';
import orchestrator from '#orchestrator/addon.js';

orchestrator.Fn('item.state.conclusion', async function(item, state)
{
    const agent = agents.ItemGet('orchestrator-conclusion');

    const { _meta, ...output } = state.output || {};

    const sent = {
        task: state.task,
        agent: state.agents.find(a => a.id === state.agent),
        history: state.history.map(({ output, input, ...rest }) => rest),
        output
    };

    const results = await agent.Fn('run', sent);

    state.conclusion = results.summary;

    if (state.debug)
    {
        state.debug(`step-${state.step}/conclusion`, { sent, received: results });
    }

    return results;
});
