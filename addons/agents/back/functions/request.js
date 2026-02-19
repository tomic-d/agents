import agents from '#agents/addon.js';

agents.Fn('request', async function(payload, retry = true)
{
    const url = process.env.AI_URL;
    const key = process.env.AI_KEY;

    try
    {
        const headers = { 'Content-Type': 'application/json' };

        if (key)
        {
            headers['Authorization'] = `Bearer ${key}`;
        }

        const response = await fetch(url,
        {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok)
        {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    }
    catch (error)
    {
        if (retry)
        {
            return await agents.Fn('request', payload, false);
        }

        throw error;
    }
});