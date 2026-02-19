import agents from '#agents/load.js';
import orchestrator from '#orchestrator/addon.js';

orchestrator.Fn('item.state.conclusion', async function(item, state)
{
    const agent = agents.ItemGet('orchestrator-conclusion');

    const results = await agent.Fn('run', `Summarize what ${state.agent} did`, {
        task: state.task,
        agent: state.agent,
        history: state.history.map(({ output, input, ...rest }) => rest),
        output: state.output
    });

    state.conclusion = results.summary;

    return results;
});
