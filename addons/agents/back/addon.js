import divhunt from 'divhunt';

const agents = divhunt.Addon('ai.agents', (addon) =>
{
    addon.Field('id', ['string|number']);
    addon.Field('name', ['string', 'JSON']);
    addon.Field('description', ['string', '']);
    addon.Field('instructions', ['string', '']);
    addon.Field('context', ['object|function', {}]);
    addon.Field('commands', ['array', []]);
    addon.Field('tokens', ['number', 8000]);
    addon.Field('model', ['string', '']);
    addon.Field('input', ['object', {}]);
    addon.Field('output', ['object', {}]);
    addon.Field('stop', ['function']);
    addon.Field('callback', ['function']);
    addon.Field('onRun', ['function']);
    addon.Field('onSuccess', ['function']);
    addon.Field('onFail', ['function']);
});

export default agents;