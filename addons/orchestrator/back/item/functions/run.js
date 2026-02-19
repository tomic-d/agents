import divhunt from 'divhunt';
import agents from '#agents/load.js';
import orchestrator from '#orchestrator/addon.js';

orchestrator.Fn('item.run', async function(item, input = {})
{
    const state = {
        input: item.Get('input'),
        agents: item.Get('agents').map(id =>
        {
            const agent = agents.ItemGet(id);

            return agent ? { id, description: agent.Get('description') } : null;
        }).filter(Boolean),
        task: item.Get('task'),
       
        history: [],
        done: false,
        output: null,
        step: null,
        goal: null,
        agent: null,
        conclusion: null,

        steps: { count: 0, total: item.Get('steps') },
        tokens: { prompt: 0, completion: 0, total: 0 }
    };

    item.Set('status', 'running');
    item.Set('state', state);

    try
    {
        while (state.steps.count < state.steps.total)
        {
            await item.Fn('state.done', state);

            if(state.done)
            {
                break;
            }

            state.steps.count++;
            state.step = state.steps.count;
          
            await item.Fn('state.agent', state);
            await item.Fn('state.goal', state);
            await item.Fn('state.input', state);
            await item.Fn('state.execute', state);
            await item.Fn('state.conclusion', state);

            state.history.push({
                step: state.step,
                done: state.done,
                agent: state.agent,
                goal: state.goal,
                conclusion: state.conclusion,
                input: state.input,
                output: state.output
            });
        }

        if(!state.done)
        {
            throw divhunt.Error(422, `Max steps (${state.steps.total}) reached without completing goal`, {state});
        }
        
        return state;
    }
    catch (error)
    {
        item.Get('onFail') && await item.Get('onFail')({ state, error });
        item.Set('status', 'failed');

        throw divhunt.Error(error.code, error.message, error.context);
    }
});