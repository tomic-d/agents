import divhunt from 'divhunt';
import agents from '#agents/load.js';
import orchestrator from '../../addon.js';

orchestrator.Fn('item.run', async function(item, goal, data = {})
{
    const state = {
        goal,
        data: { ...data },
        steps: { count: 0, total: item.Get('steps') },
        history: [],
        agents: item.Get('agents'),
        tokens: { prompt: 0, completion: 0, total: 0 },
        conclusion: null
    };

    item.Set('status', 'running');
    item.Set('state', state);

    const planner = agents.ItemGet('orchestrator-planner');
    const properties = agents.ItemGet('orchestrator-properties');

    this.methods.filter = (id) =>
    {
        if (id.startsWith('orchestrator-'))
        {
            return false;
        }

        if (state.agents.length > 0 && !state.agents.includes(id))
        {
            return false;
        }

        return true;
    };

    this.methods.agents = () =>
    {
        return Object.keys(agents.Items())
            .filter(id => this.methods.filter(id))
            .map(id =>
            {
                const agent = agents.Items()[id];

                return {
                    id: agent.Get('id'),
                    name: agent.Get('name'),
                    description: agent.Get('description'),
                    input: agent.Get('input')
                };
            });
    };

    this.methods.properties = async (agent, goal) =>
    {
        const context = typeof agent.Get('context') === 'function'
            ? agent.Get('context')({ state, goal })
            : agent.Get('context');

        const definition = {
            id: agent.Get('id'),
            name: agent.Get('name'),
            description: agent.Get('description'),
            input: agent.Get('input'),
            context
        };

        const result = await properties.Fn('run', `Prepare inputs for ${agent.Get('id')}`, { goal, agent: definition, data: state.data });

        if (result._meta)
        {
            state.tokens.prompt += result._meta.usage.prompt;
            state.tokens.completion += result._meta.usage.completion;
            state.tokens.total += result._meta.usage.total;
        }

        item.Get('onProperties') && await item.Get('onProperties')({ agent: definition, properties: result.properties, state });

        return divhunt.DataDefine(result.properties, agent.Get('input'));
    };

    this.methods.plan = async () =>
    {
        const input = {
            history: state.history,
            agents: this.methods.agents()
        };

        const plan = await planner.Fn('run', `Achieve: ${goal}`, input);

        state.conclusion = plan.conclusion;

        if (plan.meta)
        {
            state.tokens.prompt += plan.meta.usage.prompt;
            state.tokens.completion += plan.meta.usage.completion;
            state.tokens.total += plan.meta.usage.total;
        }

        item.Get('onPlanner') && await item.Get('onPlanner')({ plan, input, state });

        return plan;
    };

    this.methods.execute = async (plan) =>
    {
        const agent = agents.ItemGet(plan.agent);

        if (!agent)
        {
            throw new Error(`Agent not found: ${plan.agent}`);
        }

        const input = await this.methods.properties(agent, plan.goal);

        item.Get('onAgent') && await item.Get('onAgent')({ agent: plan.agent, goal: plan.goal, input, state });

        const result = await agent.Fn('run', plan.goal, input);

        if (result._meta)
        {
            state.tokens.prompt += result._meta.usage.prompt;
            state.tokens.completion += result._meta.usage.completion;
            state.tokens.total += result._meta.usage.total;
        }

        state.data[agent.Get('id')] = result;

        state.history.push({
            step: state.steps.count,
            agent: plan.agent,
            conclusion: result.conclusion || null
        });

        const stopFn = agent.Get('stop');
        const stop = stopFn && stopFn({ input, output: result });

        if (stop)
        {
            return { stop: typeof stop === 'string' ? stop : true, result };
        }

        return { stop: false, result };
    };

    this.methods.step = async () =>
    {
        state.steps.count++;

        const plan = await this.methods.plan();

        if (plan.done)
        {
            return { done: true };
        }

        if (!plan.agent)
        {
            throw new Error('Planner did not specify next agent');
        }

        const { stop, result } = await this.methods.execute(plan);

        item.Get('onStep') && await item.Get('onStep')({ state, result, plan, stop });

        if (stop)
        {
            return { done: true, result, stop };
        }

        return { done: false, result };
    };

    try
    {
        while (state.steps.count < state.steps.total)
        {
            const { done } = await this.methods.step();

            if (done)
            {
                item.Get('onSuccess') && await item.Get('onSuccess')({ state });
                item.Set('status', 'succeeded');
                return state;
            }
        }

        throw new Error(`Max steps (${state.steps.total}) reached without completing goal`);
    }
    catch (error)
    {
        item.Get('onFail') && await item.Get('onFail')({ state, error });
        item.Set('status', 'failed');
        throw error;
    }
});
