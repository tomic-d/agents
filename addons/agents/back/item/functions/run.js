import divhunt from 'divhunt';
import agents from '#agents/addon.js';
import providers from '#providers/addon.js';

agents.Fn('item.run', async function(agent, data = {})
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

    this.methods.input = (agent) =>
    {
        return { goal: { type: 'string', description: 'Goal to achieve' }, ...agent.Get('input') };
    };

    this.methods.system = (agent, schema) =>
    {
        let system = '=== INSTRUCTIONS (FOLLOW EXACTLY) ===\n\n';
        system += agent.Get('instructions');

        system += '\n\n=== SCHEMAS ===\n';

        const input = this.methods.input(agent);

        if (Object.keys(input).length > 0)
        {
            system += '\nInput schema: ' + JSON.stringify(input);
        }

        if (Object.keys(schema).length > 0)
        {
            system += '\nOutput schema: ' + JSON.stringify(schema);
        }

        system += '\n\nSchema fields with required: true are mandatory. Follow type and description exactly.';
        system += '\nRESPOND WITH A SINGLE-LINE JSON OBJECT. No newlines, no tabs, no formatting. Flat inline JSON only.';
        system += `\nIMPORTANT: Keep your response under ${agent.Get('tokens')} tokens. Be concise.`;

        return system;
    };

    this.methods.context = (agent, data) =>
    {
        const context = agent.Get('context');

        if (typeof context === 'function')
        {
            return context({ data });
        }

        return context;
    };

    this.methods.content = async (agent, data) =>
    {
        let content = '';
        const { goal, ...rest } = data;

        if (goal)
        {
            content += '=== GOAL ===\n';
            content += goal + '\n\n';
        }

        const context = await this.methods.context(agent, rest);

        if (context && Object.keys(context).length > 0)
        {
            content += '=== CONTEXT (read-only, do not modify) ===\n';
            content += JSON.stringify(context, null, 2) + '\n\n';
        }

        if (Object.keys(rest).length > 0)
        {
            content += '=== DATA ===\n';
            content += JSON.stringify(rest, null, 2);
        }

        return content.trim();
    };

    this.methods.format = () =>
    {
        return { type: 'json_object' };
    };

    this.methods.payload = async (agent, data) =>
    {
        const schema = this.methods.schema(agent);
        const system = this.methods.system(agent, schema);
        const content = await this.methods.content(agent, data);
        const format = this.methods.format(agent, schema);

        return {
            model: agent.Get('model'),
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

    const validated = this.methods.validate(data, this.methods.input(agent), 'Input');
    const payload = await this.methods.payload(agent, validated);

    const providerId = agent.Get('provider');
    const provider = providerId ? providers.ItemGet(providerId) : providers.Fn('default');

    if (!provider)
    {
        throw new Error(`Provider not found: ${providerId || 'default'}`);
    }

    try
    {
        agent.Get('onRun') && await agent.Get('onRun')({ payload });

        const result = await provider.Fn('request', payload);
        let parsed = agents.Fn('parse', result.content);

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

        const meta = {
            time: result.time,
            tokens: result.tokens,
            tps: result.tps,
            reasoning: result.reasoning
        };

        agent.Get('onSuccess') && await agent.Get('onSuccess')({ payload, parsed, meta });

        parsed._meta = meta;

        return parsed;
    }
    catch (error)
    {
        agent.Get('onFail') && await agent.Get('onFail')({ payload, error });
        throw error;
    }
});
