import divhunt from 'divhunt';

const orchestrator = divhunt.Addon('ai.orchestrator', (addon) =>
{
    addon.Field('id', ['string|number']);

    addon.Field('steps', ['number', 10]);
    addon.Field('agents', ['array', []]);
    addon.Field('status', ['string', 'idle']);
    addon.Field('state', ['object', null]);

    addon.Field('onPlanner', ['function', null]);
    addon.Field('onProperties', ['function', null]);
    addon.Field('onAgent', ['function', null]);
    addon.Field('onStep', ['function', null]);
    addon.Field('onSuccess', ['function', null]);
    addon.Field('onFail', ['function', null]);
});

export default orchestrator;