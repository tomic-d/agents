import agents from '#agents/addon.js';

agents.Fn('parse', function(response)
{
    let text = response?.data?.response?.trim() || '';

    text = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');

    const match = text.match(/\{[\s\S]*\}/);

    if (!match)
    {
        throw new Error('Invalid JSON response');
    }

    let json = match[0];
    let result = '';
    let inString = false;
    let escape = false;

    for (let i = 0; i < json.length; i++)
    {
        const char = json[i];

        if (escape)
        {
            result += char;
            escape = false;
            continue;
        }

        if (char === '\\')
        {
            result += char;
            escape = true;
            continue;
        }

        if (char === '"')
        {
            inString = !inString;
            result += char;
            continue;
        }

        if (inString)
        {
            if (char === '\n') { result += '\\n'; continue; }
            if (char === '\r') { result += '\\r'; continue; }
            if (char === '\t') { result += '\\t'; continue; }
        }

        result += char;
    }

    try
    {
        return JSON.parse(result);
    }
    catch (error)
    {
        console.log('[PARSE ERROR] Raw response:', text);
        console.log('[PARSE ERROR] Cleaned result:', result);
        throw error;
    }
});
