import divhunt from 'divhunt';
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import agents from '#agents/load.js';
import orchestrator from '#orchestrator/addon.js';

orchestrator.Fn('item.run', async function(item, input = {})
{
    const state = {
        data: item.Get('data'),
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
        agent: null,
        goal: null,
        conclusion: null,

        steps: { count: 0, total: item.Get('steps') },
        tokens: { input: 0, output: 0 },
        debug: null
    };

    if (item.Get('debug'))
    {
        const dir = join(process.cwd(), 'debug', String(item.Get('id')));

        if (existsSync(dir))
        {
            rmSync(dir, { recursive: true });
        }

        state.debug = (file, data) =>
        {
            const path = join(dir, `${file}.json`);

            mkdirSync(dirname(path), { recursive: true });
            writeFileSync(path, JSON.stringify(data, null, 2));
        };
    }

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
            throw divhunt.Error(422, `Max steps (${state.steps.total}) reached without completing task`, {state});
        }

        if (state.debug)
        {
            const { debug, ...clean } = state;

            state.debug('state', clean);
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