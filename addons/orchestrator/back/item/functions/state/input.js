import divhunt from 'divhunt';
import agents from '#agents/load.js';
import orchestrator from '#orchestrator/addon.js';

orchestrator.Fn('item.state.input', async function(item, state)
{
    const agent = agents.ItemGet(state.agent);
    const schema = agent.Get('input');

    const matched   = {};
    const unmatched = [];
    const defaults  = {};

    this.methods.programmatic = () =>
    {
        for (const [field, definition] of Object.entries(schema))
        {
            if (definition.value !== undefined)
            {
                defaults[field] = definition.value;
            }

            for (let i = state.history.length - 1; i >= 0; i--)
            {
                const output = state.history[i].output;

                if (output && output[field] !== undefined && field !== 'meta')
                {
                    matched[field] = output[field];
                    break;
                }
            }

            if (matched[field] === undefined)
            {
                const input = item.Get('input');

                if (input && input[field] !== undefined)
                {
                    matched[field] = input[field];
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

        /* Build structure map — keys with type/description, no values */

        const structure = {};

        for (const entry of state.history)
        {
            if (!entry.output) continue;

            const source = agents.ItemGet(entry.agent);
            const output = source ? source.Get('output') : {};

            for (const key of Object.keys(entry.output))
            {
                if (key === 'meta') continue;

                const definition = output[key];
                const description = definition?.description;
                const type = definition?.type || typeof entry.output[key];
                const prefix = definition?.required ? '*' : '';

                structure[`${entry.agent}:${key}`] = description ? `${prefix}${type} - ${description}` : `${prefix}${type}`;
            }
        }

        const original = item.Get('input');

        for (const key of Object.keys(original))
        {
            structure[`input:${key}`] = typeof original[key];
        }

        /* Ask AI to map references */

        const result = await reference.Fn('run', `Map references for ${agent.Get('id')}`, {
            task: state.task,
            agent: this.methods.definition(),
            structure
        });

        /* Resolve references against actual data */

        const sources = { input: original };

        for (const entry of state.history)
        {
            if (entry.output)
            {
                sources[entry.agent] = entry.output;
            }
        }

        for (const field of unmatched)
        {
            const mapping = result.values?.[field];

            if (typeof mapping === 'string' && mapping.includes(':'))
            {
                const [source, key] = mapping.split(':');

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

        const result = await literal.Fn('run', `Extract values for ${agent.Get('id')}`, {
            task: state.task,
            agent: this.methods.definition(),
            goal: state.goal,
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
            const definition = schema[field];
            const description = definition?.description;
            const type = definition?.type || 'string';
            const prefix = definition?.required ? '*' : '';

            fields[field] = description ? `${prefix}${type} - ${description}` : `${prefix}${type}`;
        }

        return fields;
    };

    this.methods.programmatic();

    if (unmatched.length > 0)
    {
        await this.methods.reference();
    }

    if (unmatched.length > 0)
    {
        await this.methods.literal();
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
