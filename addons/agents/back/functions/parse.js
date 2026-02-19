import agents from '#agents/addon.js';

agents.Fn('parse', function(response)
{
    let text = response?.choices?.[0]?.message?.content?.trim()
             || response?.data?.response?.trim()
             || '';

    text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    text = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
    const match = text.match(/\{[\s\S]*\}/);

    if (!match)
    {
        console.log('[PARSE ERROR] No JSON found in response:', text);
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
            if (/[\u201C\u201D\u201E\u201F]/.test(char)) { result += '\\"'; continue; }
            if (/[\u2018\u2019\u201A\u201B]/.test(char)) { result += "'"; continue; }
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
    catch
    {
        /* Fix wrapped strings: "key": { "value" } → "key": "value" */
        const fixed = result.replace(/:\s*\{\s*("(?:[^"\\]|\\.)*?")\s*\}/g, ': $1');

        try
        {
            return JSON.parse(fixed);
        }
        catch (error)
        {
            console.log('[PARSE ERROR] Raw response:', text);
            console.log('[PARSE ERROR] Cleaned result:', result);
            console.log('[PARSE ERROR] Fixed attempt:', fixed);
            throw error;
        }
    }
});
