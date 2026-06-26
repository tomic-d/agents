import providers from '#providers/addon.js';

providers.Item({
    id: 'ollama',
    name: 'Ollama',
    default: true,
    endpoint: 'http://localhost:11434/v1/chat/completions',
    key: '',
    model: 'devstral-small-2:24b-cloud',
    models: {
        'qwen3.5:397b-cloud': {
            tokens: 32768,
            thinking: true,
            price: { input: 0, output: 0 }
        },
        'qwen3-next:80b-cloud': {
            tokens: 32768,
            thinking: true,
            price: { input: 0, output: 0 }
        },
        'devstral-small-2:24b-cloud': {
            tokens: 32768,
            thinking: false,
            price: { input: 0, output: 0 }
        }
    },
    onBeforeRequest: ({ payload }) =>
    ({
        headers: {
            'Content-Type': 'application/json'
        },
        body: payload
    }),
    onAfterRequest: ({ response }) =>
    {
        const message = response.choices[0].message;
        const usage = response.usage;

        return {
            content: message.content.trim(),
            reasoning: message.reasoning ? message.reasoning.trim() : null,
            tokens: {
                input: usage.prompt_tokens,
                output: usage.total_tokens
            }
        };
    }
});
