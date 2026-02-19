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

    const pipeline = {
        done: agents.ItemGet('orchestrator-done'),
        selector: agents.ItemGet('orchestrator-selector'),
        goal: agents.ItemGet('orchestrator-goal'),
        conclusion: agents.ItemGet('orchestrator-conclusion'),
        reference: agents.ItemGet('orchestrator-reference'),
        literal: agents.ItemGet('orchestrator-literal')
    };

    this.methods.tokens = (result) =>
    {
        if (result.meta)
        {
            state.tokens.prompt += result.meta.usage.prompt;
            state.tokens.completion += result.meta.usage.completion;
            state.tokens.total += result.meta.usage.total;
        }
    };

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

            for (const [id, output] of Object.entries(state.output))
            {
                const source = agents.ItemGet(id);
                const outputSchema = source ? source.Get('output') : {};

                structure[id] = Object.keys(output)
                    .filter(k => k !== 'meta' && k !== 'conclusion')
                    .map(k => ({
                        key: k,
                        type: outputSchema[k]?.type || typeof output[k],
                        description: outputSchema[k]?.description || null
                    }));
            }

            structure.input = Object.keys(state.input).map(k => ({
                key: k,
                type: typeof state.input[k]
            }));

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

            const result = await pipeline.reference.Fn('run', `Map references for ${agent.Get('id')}`, { agent: definition, structure });

            this.methods.tokens(result);

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

            const result = await pipeline.literal.Fn('run', `Extract values for ${agent.Get('id')}`, { agent: definition, goal });

            this.methods.tokens(result);

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
        const available = this.methods.agents();
        const input = { history: state.history, agents: available };

        /* 1. Done check */
        const doneResult = await pipeline.done.Fn('run', `Check: ${goal}`, input);

        this.methods.tokens(doneResult);

        if (doneResult.done || available.length === 0)
        {
            /* 2a. Conclusion */
            const conclusionResult = await pipeline.conclusion.Fn('run', `Conclude: ${goal}`, { history: state.history });

            this.methods.tokens(conclusionResult);

            state.conclusion = conclusionResult.summary;

            const plan = { done: true, goal: conclusionResult.summary };

            item.Get('onPlanner') && await item.Get('onPlanner')({ plan, input, state });

            return plan;
        }

        /* 2b. Select agent */
        const selectResult = await pipeline.selector.Fn('run', `Select for: ${goal}`, input);

        this.methods.tokens(selectResult);

        if (!selectResult.agent || !agents.ItemGet(selectResult.agent))
        {
            throw new Error(`Selector picked invalid agent: ${selectResult.agent}`);
        }

        /* 3. Write goal */
        const agentItem = agents.ItemGet(selectResult.agent);
        const agentDef = {
            id: agentItem.Get('id'),
            name: agentItem.Get('name'),
            description: agentItem.Get('description')
        };

        const goalResult = await pipeline.goal.Fn('run', `Goal for: ${goal}`, { agent: agentDef, history: state.history });

        this.methods.tokens(goalResult);

        const plan = {
            done: false,
            agent: selectResult.agent,
            goal: goalResult.goal
        };

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

        this.methods.tokens(result);

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
