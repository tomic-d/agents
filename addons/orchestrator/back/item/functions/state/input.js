import divhunt from 'divhunt';
import agents from '#agents/load.js';
import orchestrator from '#orchestrator/addon.js';

orchestrator.Fn('item.state.input', async function(item, state)
{
    const agent = agents.ItemGet(state.agent);
    const schema = agent.Get('input');

    const matched   = {};
    let   unmatched = [];
    const defaults  = {};

    this.methods.programmatic = () =>
    {
        const pool = [];

        for (const entry of state.history)
        {
            if (!entry.output) continue;

            for (const key of Object.keys(entry.output))
            {
                if (key !== '_meta') pool.push(key);
            }
        }

        const data = item.Get('data');

        if (data)
        {
            for (const key of Object.keys(data))
            {
                pool.push(key);
            }
        }

        for (const [field, definition] of Object.entries(schema))
        {
            if (definition.value !== undefined)
            {
                defaults[field] = definition.value;
            }

            const pattern = new RegExp(field);
            const similar = pool.filter(key => pattern.test(key));

            if (similar.length !== 1)
            {
                unmatched.push(field);
                continue;
            }

            for (let i = state.history.length - 1; i >= 0; i--)
            {
                const output = state.history[i].output;

                if (output && output[field] !== undefined && field !== '_meta')
                {
                    matched[field] = output[field];
                    break;
                }
            }

            if (matched[field] === undefined)
            {
                if (data && data[field] !== undefined)
                {
                    matched[field] = data[field];
                }
            }

            if (matched[field] === undefined)
            {
                unmatched.push(field);
            }
        }
    };

    this.methods.reference = async () =>
    {
        const reference = agents.ItemGet('orchestrator-reference');

        /* Build references map — agent:step:key format */

        const references = {};

        for (const entry of state.history)
        {
            if (!entry.output) continue;

            const source = agents.ItemGet(entry.agent);
            const output = source ? source.Get('output') : {};

            for (const key of Object.keys(entry.output))
            {
                if(key === '_meta')
                {
                    continue;
                }

                const ref = output[key] || { type: typeof entry.output[key] };
                const val = entry.output[key];
                const preview = JSON.stringify(val);

                ref.preview = preview.length > 500 ? preview.slice(0, 500) + '…' : preview;

                references[`${entry.agent}:${entry.step}:${key}`] = ref;
            }
        }

        const original = item.Get('data');

        for (const key of Object.keys(original))
        {
            const preview = JSON.stringify(original[key]);

            references[`data:${key}`] = { type: typeof original[key], description: key, preview: preview.length > 500 ? preview.slice(0, 500) + '…' : preview };
        }

        /* Ask AI to map references */

        const result = await reference.Fn('run', {
            goal: state.goal,
            step: state.step,
            agent: { id: agent.Get('id'), description: agent.Get('description') },
            fields: this.methods.definition(),
            references,
            history: state.history.map(({ output, input, ...rest }) => rest)
        });

        /* Resolve references — agent:step:key format */

        const sources = { data: original };

        for (const entry of state.history)
        {
            if (entry.output)
            {
                sources[`${entry.agent}:${entry.step}`] = entry.output;
            }
        }

        for (const field of unmatched)
        {
            const mapping = result.values?.[field];

            if (typeof mapping === 'string' && mapping.includes(':'))
            {
                const parts = mapping.split(':');
                const key = parts.pop();
                const source = parts.join(':');

                if (sources[source] && sources[source][key] !== undefined)
                {
                    matched[field] = sources[source][key];
                }
            }
        }
    };

    this.methods.literal = async () =>
    {
        const literal = agents.ItemGet('orchestrator-literal');

        const result = await literal.Fn('run', {
            task: state.task,
            agent: { id: agent.Get('id'), description: agent.Get('description') },
            fields: this.methods.definition(),
            history: state.history.map(({ output, input, ...rest }) => rest)
        });

        for (const field of unmatched)
        {
            if (result.values?.[field] !== undefined && result.values[field] !== null)
            {
                matched[field] = result.values[field];
            }
        }
    };

    this.methods.definition = () =>
    {
        const fields = {};

        for (const field of unmatched)
        {
            fields[field] = schema[field] || { type: 'string' };
        }

        return fields;
    };

    this.methods.programmatic();

    if (unmatched.length > 0)
    {
        await this.methods.reference();
        unmatched = unmatched.filter(field => matched[field] === undefined);
    }

    if (unmatched.length > 0)
    {
        await this.methods.literal();
        unmatched = unmatched.filter(field => matched[field] === undefined);
    }

    for (const field of unmatched)
    {
        if (defaults[field] !== undefined)
        {
            matched[field] = defaults[field];
        }
    }

    state.input = divhunt.DataDefine(matched, agent.Get('input'));
});
