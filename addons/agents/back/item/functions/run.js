import divhunt from 'divhunt';
import agents from '../../addon.js';

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

        schema.conclusion = {
            type: 'string',
            required: true,
            description: 'Status message: "Done: [what was accomplished]" - signals task complete, ready for next step'
        };

        return schema;
    };

    this.methods.system = (agent, schema) =>
    {
        let system = '=== INSTRUCTIONS (FOLLOW EXACTLY) ===\n\n';
        system += agent.Get('instructions');

        system += '\n\n=== SCHEMAS ===\n';

        if (Object.keys(agent.Get('input')).length > 0)
        {
            system += '\nInput schema: ' + JSON.stringify(agent.Get('input'));
        }

        if (Object.keys(schema).length > 0)
        {
            system += '\nOutput schema: ' + JSON.stringify(schema);
        }

        system += '\n\nREQUIRED: Always include "conclusion" field with "Done: [what was accomplished]"';

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
        const schema = this.methods.schema(agent);
        const system = this.methods.system(agent, schema);
        const content = this.methods.content(agent, data, goal);
        const format = this.methods.format(agent, schema);

        return {
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: content }
            ],
            max_tokens: agent.Get('tokens'),
            temperature: 0,
            top_p: 0.1,
            response_format: format
        };
    };

    this.methods.metadata = (result) =>
    {
        const time = parseFloat(result.time);
        const total = result.data.usage.total_tokens;
        const tps = time > 0 ? (total / (time / 1000)).toFixed(2) : 0;

        return {
            time: time + 'ms',
            usage: {
                prompt: result.data.usage.prompt_tokens,
                completion: result.data.usage.completion_tokens,
                total
            },
            tps: parseFloat(tps)
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
