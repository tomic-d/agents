import divhunt from 'divhunt';
import agents from '#agents/addon.js';

agents.Fn('item.run', async function(agent, goal, data = {})
{
    this.methods.schema = (agent) =>
    {
        const schema = {};

        for (const [key, value] of Object.entries(agent.Get('output')))
        {
            if (value.populate !== false)
            {
                schema[key] = value;
            }
        }

        return schema;
    };

    this.methods.system = (agent, schema) =>
    {
        let system = '=== INSTRUCTIONS (FOLLOW EXACTLY) ===\n\n';
        system += agent.Get('instructions');

        system += '\n\n=== SCHEMAS ===\n';

        if (Object.keys(agent.Get('input')).length > 0)
        {
            const shape = {};

            for (const [key, value] of Object.entries(agent.Get('input')))
            {
                const type = value.type || 'string';
                const prefix = value.required ? '*' : '';

                shape[key] = value.description ? `${prefix}${type} - ${value.description}` : `${prefix}${type}`;
            }

            system += '\nInput schema: ' + JSON.stringify(shape);
        }

        if (Object.keys(schema).length > 0)
        {
            const shape = {};

            for (const [key, value] of Object.entries(schema))
            {
                const type = value.type || 'string';
                const prefix = value.required ? '*' : '';

                shape[key] = value.description ? `${prefix}${type} - ${value.description}` : `${prefix}${type}`;
            }

            system += '\nOutput schema: ' + JSON.stringify(shape);
        }

        system += '\n\nFields prefixed with * are required. Schema descriptions define allowed values and constraints. Follow them exactly.';
        system += '\nRESPOND WITH A SINGLE-LINE JSON OBJECT. No newlines, no tabs, no formatting. Flat inline JSON only.';
        system += `\nIMPORTANT: Keep your response under ${agent.Get('tokens')} tokens. Be concise.`;

        return system;
    };

    this.methods.context = (agent, data, goal) =>
    {
        const context = agent.Get('context');

        if (typeof context === 'function')
        {
            return context({ data, goal });
        }

        return context;
    };

    this.methods.content = (agent, data, goal) =>
    {
        let content = '';

        const context = this.methods.context(agent, data, goal);

        if (context && Object.keys(context).length > 0)
        {
            content += '=== CONTEXT (read-only, do not modify) ===\n';
            content += JSON.stringify(context, null, 2) + '\n\n';
        }

        if (Object.keys(data).length > 0)
        {
            content += '=== CONTEXT (use this to produce output) ===\n';
            content += JSON.stringify(data, null, 2) + '\n\n';
        }

        if (goal)
        {
            content += '=== GOAL ===\n' + goal;
        }

        return content.trim();
    };

    this.methods.format = () =>
    {
        return { type: 'json_object' };
    };

    this.methods.payload = (agent, data, goal) =>
    {
        const model = process.env.AI_MODEL;

        const schema = this.methods.schema(agent);
        const system = this.methods.system(agent, schema);
        const content = this.methods.content(agent, data, goal);
        const format = this.methods.format(agent, schema);

        return {
            model,
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: content }
            ],
            max_tokens: 15000,
            temperature: 0.7,
            top_p: 0.1,
            response_format: format
        };
    };

    this.methods.metadata = (result) =>
    {
        /* nue.tools format */
        const usage = result.data?.usage || result.usage;

        if (!usage)
        {
            return { time: '0ms', usage: { prompt: 0, completion: 0, total: 0 }, tps: 0 };
        }

        const prompt = usage.prompt_tokens || 0;
        const completion = usage.completion_tokens || 0;
        const total = usage.total_tokens || prompt + completion;
        const time = parseFloat(result.time || 0);
        const tps = time > 0 ? parseFloat((total / (time / 1000)).toFixed(2)) : 0;

        return {
            time: time + 'ms',
            usage: { prompt, completion, total },
            tps
        };
    };

    this.methods.validate = (data, schema, type) =>
    {
        if (Object.keys(schema).length === 0)
        {
            return data;
        }

        try
        {
            return divhunt.DataDefine(data, schema);
        }
        catch (error)
        {
            throw new Error(`Agent ${type} Error: ${error.message}`);
        }
    };

    const validated = this.methods.validate(data, agent.Get('input'), 'Input');
    const payload = this.methods.payload(agent, validated, goal);

    try
    {
        agent.Get('onRun') && await agent.Get('onRun')({ payload });

        const result = await agents.Fn('request', payload);
        const meta   = this.methods.metadata(result);

        console.log(result);

        let parsed = agents.Fn('parse', result);

        if (agent.Get('callback'))
        {
            await agent.Get('callback')({ input: validated, output: parsed });
            parsed = this.methods.validate(parsed, agent.Get('output'), 'Output Post-Callback');
        }
        else
        {
            parsed = this.methods.validate(parsed, agent.Get('output'), 'Output');
        }

        const missing = Object.keys(agent.Get('output')).filter(k => parsed[k] === undefined);

        if (missing.length > 0)
        {
            throw new Error(`Missing output fields: ${missing.join(', ')}`);
        }

        agent.Get('onSuccess') && await agent.Get('onSuccess')({ payload, parsed, meta });

        parsed.meta = meta;

        return parsed;
    }
    catch (error)
    {
        agent.Get('onFail') && await agent.Get('onFail')({ payload, error });
        throw error;
    }
});
