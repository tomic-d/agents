import providers from '#providers/addon.js';

providers.Fn('item.request', async function(provider, payload)
{
    const key = process.env[provider.Get('key')] || '';
    const model = payload.model || provider.Get('model');
    const config = provider.Get('models')[model] || {};

    const before = provider.Get('onBeforeRequest')({ payload: { ...payload, model }, key, config });

    const attempt = async (retry) =>
    {
        try
        {
            const start = Date.now();

            const response = await fetch(provider.Get('endpoint'),
            {
                method: 'POST',
                headers: before.headers,
                body: JSON.stringify(before.body)
            });

            if (!response.ok)
            {
                throw new Error(`API error: ${response.status}`);
            }

            const raw = await response.json();
            const time = Date.now() - start;

            const after = provider.Get('onAfterRequest')({ response: raw, model, config });
            const tps = time > 0 ? parseFloat((after.tokens.output / (time / 1000)).toFixed(2)) : 0;

            return {
                content: after.content,
                reasoning: after.reasoning,
                tokens: after.tokens,
                time,
                tps
            };
        }
        catch (error)
        {
            if (retry)
            {
                return await attempt(false);
            }

            throw error;
        }
    };

    return await attempt(true);
});
