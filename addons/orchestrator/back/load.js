import orchestrator from '#orchestrator/addon.js';

/* Items */
import '#orchestrator/items/agents/done.js';
import '#orchestrator/items/agents/agent.js';
import '#orchestrator/items/agents/goal.js';
import '#orchestrator/items/agents/conclusion.js';
import '#orchestrator/items/agents/reference.js';
import '#orchestrator/items/agents/literal.js';

/* Functions */
import '#orchestrator/item/functions/state/agent.js';
import '#orchestrator/item/functions/state/goal.js';
import '#orchestrator/item/functions/state/done.js';
import '#orchestrator/item/functions/state/input.js';
import '#orchestrator/item/functions/state/conclusion.js';
import '#orchestrator/item/functions/state/execute.js';
import '#orchestrator/item/functions/run.js';

export default orchestrator;
