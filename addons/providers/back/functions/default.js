import providers from '#providers/addon.js';

providers.Fn('default', function()
{
    const items = Object.values(providers.Items());
    const defaults = items.filter(p => p.Get('default'));

    if (defaults.length === 0)
    {
        return items[0] || null;
    }

    return defaults[Math.floor(Math.random() * defaults.length)];
});
