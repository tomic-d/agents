import agents from '../addon.js';

agents.Fn('request', async function(payload, retry = true)
{
    try
    {
        const response = await fetch('https://nue.tools.divhunt.com/api/run/ai-chat',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
