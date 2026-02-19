import divhunt from 'divhunt';
import agents from '#agents/load.js';
import orchestrator from '#orchestrator/addon.js';

orchestrator.Fn('item.run', async function(item, goal, data = {})
{
    const state = {
        goal,
        input: data,
        output: {},
        steps: { count: 0, total: item.Get('steps') },
        history: [],
        agents: item.Get('agents'),
        tokens: { prompt: 0, completion: 0, total: 0 },
        conclusion: null
    };

    item.Set('status', 'running');
    item.Set('state', state);

    const planner = agents.ItemGet('orchestrator-planner');
    const reference = agents.ItemGet('orchestrator-reference');
    const literal = agents.ItemGet('orchestrator-literal');

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
        const schema = agent.Get('input');
        const matched = {};
        const defaults = {};
        let unmatched = [];

        for (const [field, definition] of Object.entries(schema))
        {
            if (definition.value !== undefined)
            {
                defaults[field] = definition.value;
            }

            let found = false;

            for (let i = state.history.length - 1; i >= 0; i--)
            {
                const output = state.output[state.history[i].agent];

                if (output && output[field] !== undefined && field !== 'meta' && field !== 'conclusion')
                {
                    matched[field] = output[field];
                    found = true;
                    break;
                }
            }

            if (!found && state.input && state.input[field] !== undefined)
            {
                matched[field] = state.input[field];
                found = true;
            }

            if (!found)
            {
                unmatched.push(field);
            }
        }

        if (unmatched.length > 0)
        {
            const structure = {};

            for (const [key, value] of Object.entries(state.output))
            {
                structure[key] = Object.keys(value).filter(k => k !== 'meta' && k !== 'conclusion');
            }

            structure.input = Object.keys(state.input);

            const unmatchedSchema = {};

            for (const field of unmatched)
            {
                unmatchedSchema[field] = schema[field];
            }

            const definition = {
                id: agent.Get('id'),
                name: agent.Get('name'),
                description: agent.Get('description'),
                input: unmatchedSchema
            };

            const result = await reference.Fn('run', `Map references for ${agent.Get('id')}`, { agent: definition, structure });

            if (result.meta)
            {
                state.tokens.prompt += result.meta.usage.prompt;
                state.tokens.completion += result.meta.usage.completion;
                state.tokens.total += result.meta.usage.total;
            }

            const data = { input: state.input, ...state.output };

            for (const field of unmatched)
            {
                const ref = result.properties?.[field];

                if (typeof ref === 'string' && ref.startsWith('@'))
                {
                    const expression = ref.slice(1).replace(/^([^.]+)/, "data['$1']");
                    const resolved = divhunt.Function(expression, { data }, true);

                    if (resolved !== undefined)
                    {
                        matched[field] = resolved;
                    }
                }
            }

            unmatched = unmatched.filter(f => matched[f] === undefined);
        }

        if (unmatched.length > 0)
        {
            const unmatchedSchema = {};

            for (const field of unmatched)
            {
                unmatchedSchema[field] = schema[field];
            }

            const definition = {
                id: agent.Get('id'),
                name: agent.Get('name'),
                description: agent.Get('description'),
                input: unmatchedSchema
            };

            const result = await literal.Fn('run', `Extract values for ${agent.Get('id')}`, { agent: definition, goal });

            if (result.meta)
            {
                state.tokens.prompt += result.meta.usage.prompt;
                state.tokens.completion += result.meta.usage.completion;
                state.tokens.total += result.meta.usage.total;
            }

            for (const field of unmatched)
            {
                if (result.properties?.[field] !== undefined && result.properties[field] !== null)
                {
                    matched[field] = result.properties[field];
                }
            }

            unmatched = unmatched.filter(f => matched[f] === undefined);
        }

        for (const field of unmatched)
        {
            if (defaults[field] !== undefined)
            {
                matched[field] = defaults[field];
            }
        }

        item.Get('onProperties') && await item.Get('onProperties')({ properties: matched, state });

        return divhunt.DataDefine(matched, schema);
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

        if (result.meta)
        {
            state.tokens.prompt += result.meta.usage.prompt;
            state.tokens.completion += result.meta.usage.completion;
            state.tokens.total += result.meta.usage.total;
        }

        state.output[agent.Get('id')] = result;

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
